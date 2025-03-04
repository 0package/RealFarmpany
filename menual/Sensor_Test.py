import RPi.GPIO as GPIO
import time
import adafruit_dht
import board

GPIO.setmode(GPIO.BCM)
GPIO.setup(17, GPIO.OUT)  #RLED
GPIO.setup(27, GPIO.OUT)  #BLED
GPIO.setup(23, GPIO.IN)   #Temperature & Humidity
GPIO.setup(21, GPIO.OUT)  #Fan

dhtDevice = adafruit_dht.DHT11(board.D23)
GPIO.output(17, False)
GPIO.output(27, False)
GPIO.output(21, False)

while True:
    temperature = 0
    humidity = 0
    try:
        #temperature = float(input('Temp > '))
        #humidity = float(input('Humi > '))
        temperature = dhtDevice.temperature
        humidity = dhtDevice.humidity
        print(f'Temp: {temperature}, Humi: {humidity}')
        time.sleep(2)
    except RuntimeError as error:
        print(error.args[0])
    except KeyboardInterrupt:
        break
    
    if temperature > 10.0:
        GPIO.output(17, True)
        GPIO.output(27, False)
        GPIO.output(21, True)
        print('So Hot. RLED ON. Fan Running...')
    elif temperature > 4.0:
        GPIO.output(17, False)
        GPIO.output(27, False)
        GPIO.output(21, False)
        print('So Cold. Fan Stop. LED OFF.')
    else:
        GPIO.output(17, False)
        GPIO.output(27, True)
        GPIO.output(21, False)
        print('So Cold. BLED ON. Fan Stop.')
        
dhtDevice.exit()
