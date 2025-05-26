import RPi.GPIO as GPIO
import time
from datetime import datetime
import adafruit_dht
import board
import requests
import spidev
import math

import sqlite3

conn = sqlite3.connect("farm.db",check_same_thread=False)
cursor = conn.cursor()

# init Setting ##~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
#Pins
rled = 17 #test
bled = 27 #test
th_pin = 4
soil_pin = 0
co2_pin = 0

led_pin = 19
fan_pin = 23
cooler_pin = 24
water_pin = 18
heater_pin = 5

#RaspberryPi Pin
GPIO.setmode(GPIO.BCM)     #set mode

#sensor
GPIO.setup(th_pin, GPIO.IN)    #Temp, Humi
GPIO.setup(soil_pin, GPIO.IN)  #Soil Moisture
GPIO.setup(co2_pin, GPIO.IN)   #CO2
#device
GPIO.setup(led_pin, GPIO.OUT)     #LED
GPIO.setup(fan_pin, GPIO.OUT)     #Fan
GPIO.setup(cooler_pin, GPIO.OUT)  #Cooler
GPIO.setup(water_pin, GPIO.OUT)   #Water
GPIO.setup(heater_pin, GPIO.OUT)  #Heater

dhtDevice = adafruit_dht.DHT11(board.D4)

GPIO.output(led_pin, False)
GPIO.output(fan_pin, False)
GPIO.output(cooler_pin, False)
GPIO.output(water_pin, False)
GPIO.output(heater_pin, False)

#SPI setting
spi = spidev.SpiDev()
spi.open(0,0)
spi.max_speed_hz = 1000000

R1 = 23500
R2 = 10000

cal_A = 1.703
cal_B = 0.2677

led_on_hour = 6
led_off_hour = 22

#Attributes
changed = False
update_data = []
alarm_text = {'led':'None','fan':'None','cooler':'None','water':'None','heater':'None'}

# Server URL #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
url = 'https://port-0-server-m7tucm4sab201860.sel4.cloudtype.app/sensors'
burl = 'https://port-0-server-m7tucm4sab201860.sel4.cloudtype.app'

# test_h/w_num #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
user_id = 'user@gmail.com'
farm_id = 34


# Sensor Data #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

def read_adc(channel):
    if channel < 0 or channel > 7:
        return -1
    adc = spi.xfer2([1, (8+channel) << 4, 0])
    data = ((adc[1] & 3) << 8) + adc[2]
    return data

def measure_emf_ini(channel):
    print("초기 EMF 측정 중 (3초 대기)...")
    time.sleep(3)
    emf_values = []
    for _ in range(30):  # 약 6초 동안 측정
        adc_val = read_adc(channel)
        v_out = (adc_val * 3.3) / 1023
        emf = v_out * ((R1 + R2) / R2)
        emf_values.append(emf)
        time.sleep(0.2)
    emf_ini = sum(emf_values) / len(emf_values)
    print(f"[EMF_ini] 초기 기준 전압: {emf_ini:.3f} V")
    return emf_ini


def calculate_watering_time(current_moisture, target_moisture, soil_volume_ml=24000, pump_flow_ml_per_sec=33.3):
    if current_moisture >= target_moisture:
        return 0

    required_water_ml = (soil_volumn_ml * target_moisture - current_moisture) / 100
    watering_time_sec = required_water_ml / pump_flow_ml_per_sec
    return round(watering_time_sec, 2)

def moisture_percentage(adc_value, dry_value=1022, wet_value=356):
    adc_value = max(min(adc_value, dry_value), wet_value)
    percent = (dry_value - adc_value) * 100 / (dry_value - wet_value)
    return round(percent, 1)


def convert_to_co2(adc_value, emf_ini):
    v_out = (adc_value * 3.3) / 1023
    emf = v_out * ((R1 + R2) / R2)

    ratio = emf / emf_ini
    if ratio <= 0:
        return 0

    co2_ppm = math.pow(10, (cal_A - ratio) / cal_B)
    return round(co2_ppm)


def get_sensor_data():
    
    farm_id = 34
    #temperature = float(input('Temp>'))
    #humidity = float(input('Humi>'))
    try:
        temperature = round(dhtDevice.temperature, 2)
        humidity = round(dhtDevice.temperature, 2)
        time.sleep(2)
    except:
        temperature = round(dhtDevice.temperature, 2)
        humidity = round(dhtDevice.temperature, 2)
        time.sleep(2)

    adc_soil_val = read_adc(0)
    soil_moisture = moisture_percentage(adc_soil_val)
    
    
    adc_co2_val = read_adc(1)
    co2 = convert_to_co2(adc_co2_val, emf_ini)
    
    ctrl_devices(temperature, humidity, soil_moisture, co2)
    print(f'Temp: {temperature}, Humi: {humidity}, Soil: {soil_moisture}, CO2: {co2}')
    return farm_id, temperature, humidity, soil_moisture, co2

# Control #~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

def ctrl_devices(temperature, humidity, soil_moisture, co2):
    global changed
    
    cursor.execute("select auto from farm_info where farm_id = 34")
    auto = cursor.fetchone()
    cursor.execute("select duration from farm_info where farm_id = 34")
    duration = cursor.fetchone()
    
    # 0: led, 1: fan, 2: cooler, 3: water, 4: heat
    cursor.execute("select * from device_status where id = 0")
    device = cursor.fetchone()
    cursor.execute("select * from sensor_opt where id = 0")
    opt = cursor.fetchone()
    tmin = opt[0]
    tmax = opt[1]
    hmin = opt[2]
    hmax = opt[3]
    smin = opt[4]
    smax = opt[5]
    cmin = opt[6]
    cmax = opt[7]
    
    if auto[0]:
        #LED
        now = datetime.now()
        current_hour = now.hour

        if led_on_hour <= current_hour < led_off_hour:
            GPIO.output(led_pin, True)
            cursor.execute("update device_status set led = 1 where id = 0")
            conn.commit()
            update_data.append('led')
            alarm_text['led'] = '오전 6시led가 켜졌습니다.'
        else:
            GPIO.output(led_pin, False)
            cursor.execute("update device_status set led = 0 where id = 0")
            conn.commit()
            update_data.append('led')
            alarm_text['led'] = '오후 22시 led가 꺼졌습니다.'

        #WATER
        if soil_moisture > smin: # dry
            if device[3] == 0: # WATER
                changed = True
                cursor.execute("update device_status set water = 1 where id = 0")
                conn.commit()
                update_data.appned('water')
                alarm_text['water'] = ''
        elif soil_moisture < smax and device[3] == 1: # watery
            if device[3] == 1:
                changed = True
                cursor.execute("update device_status set water = 0 where id = 0")
                conn.commit()
                update_data.append('water')
                alarm_text['water'] = ''
                
        #FAN
        if temperature > tmin or humidity > hmin or co2 > cmax:
            if device[1] == 0: # FAN
                changed = True
                cursor.execute("update device_status set fan = 1 where id = 0")
                conn.commit()
                update_data.append('fan')
                alarm_text['fan'] = ''
            
        elif humidity < hmax or co2 < cmin:
            if device[1] == 1:
                changed = True
                cursor.execute("update device_status set fan = 0 where id = 0")
                conn.commit()
                update_data.append('fan')
                alarm_text['fan'] = ''
                
        #HEATER/COOLER
        if temperature < tmin: # HEAT ON & COOLER OFF
            if device[4] == 0: #HEAT
                changed = True
                cursor.execute("update device_status set heat = 1 where id = 0")
                conn.commit()
                update_data.append('heater')
                alarm_text['heater'] = ''
            if device[2] == 1:  #COOLER
                changed = True
                cursor.execute("update device_status set cooler = 0 where id = 0")
                conn.commit()
                update_data.append('cooler')
                alarm_text['cooler'] = ''
        elif temperature > tmax: # HEAT OFF & COOLER ON
            if device[4] == 1:
                changed = True
                cursor.execute("update device_status set heat = 0 where id = 0")
                conn.commit()
                update_data.append('heater')
                alarm_text['heater'] = ''
            if device[2] == 0:
                changed = True
                cursor.execute("update device_status set cooler = 1 where id = 0")
                conn.commit()
                update_data.append('cooler')
                alarm_text['cooler'] = ''
        else: # HEAT OFF & COOLER OFF
            if device[4] == 1:
                changed = True
                cursor.execute("update device_status set heat = 0 where id = 0")
                conn.commit()
                update_data.append('heater')
                alarm_text['heater'] = ''
            
            if device[2] == 1:
                changed = True
                cursor.execute("update device_status set cooler = 0 where id = 0")
                conn.commit()
                update_data.append('cooler')
                alarm_text['cooler'] = ''
                
        print(f'Temp : {temperature}, Humi : {humidity}, CtrlChange :',changed)
        
    else:
        start_time = time.time()
        print("Auto OFF", duration[0])
        while True:
            print(time.time() - start_time)
            if time.time() - start_time >= duration[0]:
                cursor.execute("update farm_info set auto = 1 where farm_id = 34")
                conn.commit()
                print("duration over, auto on!")
                break
            
            GPIO.output(led_pin, device[0])
            GPIO.output(fan_pin, device[1])
            GPIO.output(cooler_pin, device[2])
            GPIO.output(water_pin, device[3])
            GPIO.output(heater_pin, device[4])



# SET_DEVICES(): set devices with cdata
def set_devices():
     # 0: led, 1: fan, 2: cooler, 3: water, 4: heat
    cursor.execute("select * from device_status where id = 0")
    device = cursor.fetchone()
    
    #LED
    if device[0]:
        GPIO.output(led_pin, True) #LED ON
    else:
        GPIO.output(led_pin, False) #LED OFF
    
    #FAN
    if device[1]:
        GPIO.output(fan_pin, True)
        return "fan"
    else:
        GPIO.output(fan_pin, False)
        
    #COOLER
    if device[2]:
        return "cooler on"
        #GPIO.output() #LED ON
    else:
        GPIO.output() #LED OFF
        return "cooler off"
        
    #WATER
    if device[3]:
        GPIO.output() #LED ON
        return "water on"
    else:
        GPIO.output() #LED OFF
        return "water off"
        
    #HEATER
    if device[4]:
        GPIO.output() #LED ON
        return "heater on"
    else:
        #GPIO.output() #LED OFF
        return "heater off"
        
    print("Complete setting Devices")

# Test #~~~~~~~~~~~~~~~~~~~~~~~
#start_time = time.time()

emf_ini = measure_emf_ini(1)
while True:
    print("Running...")
    time.sleep(5)
    cursor.execute("select auto from farm_info where farm_id = 34")
    auto_c = cursor.fetchone()
    cursor.execute("select duration from farm_info where farm_id = 34")
    duration_c = cursor.fetchone()
    print("auto:",auto_c[0],"duration:",duration_c[0])

    #if time.time() - start_time > 180:
    #    print('Program stopped after 3 minutes')
    #    break
 
    farm_id, temperature, humidity, soil_moisture, co2 = get_sensor_data()
    data = {'farm_id':farm_id, 'temperature':temperature, 'humidity':humidity, 'soil_moisture':soil_moisture, 'co2':co2}
    set_devices()
    ctrl_devices(temperature, humidity, soil_moisture, co2)
    try:
        #POST Request
        response = requests.post(url, json=data)
        if response.status_code == 200:
            print(f'Data Sent: {data}')
        else:
            print(f'Error:{response.status_code} - {response.text}')
            print(response.text)
    except requests.RequestException as e:
        print(f'Network Error : {e}')
    except KeyboardInterrupt:
        GPIO.cleanup()
        break

    if changed:
        for device in update_data:
            cursor.execute(f"select {device} from device_status where id = 0")
            cdata = cursor.fetchone()
            chdata = {'farm_id':farm_id, 'device':device, 'status':cdata[0], 'content':alarm_text[device]}, 
            try:
                response = requests.post(f'{burl}/devices/{device}/status',json=chdata)
                if response.status_code == 200:
                    print(f'Data Sent: {chdata}')
                else:
                    print(f'Error:{response.status_code} - {response.text}')
            except requests.RequestException as e:
                print(f'Network Error : {e}')
                
        update_data = []
        changed = False
                
    time.sleep(1)

#GPIO.output(17, False)
#GPIO.output(27, False)
#GPIO.output(21, False)
GPIO.cleanup
