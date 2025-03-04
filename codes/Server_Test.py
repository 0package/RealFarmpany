import requests
import random
import time

def get_sensor_data():
    temperature = round(random.uniform(20,30),2)
    humidity = round(random.uniform(50,70),2)
    soil_moisture=35.5
    led='ON'
    fan='OFF'
    water='ON'
    return temperature, humidity, soil_moisture, led, fan, water

url = [IP 주소]

start_time = time.time()
while True:
    print('Running...')
    time.sleep(5)
    
    if time.time() - start_time > 180:
        print('Program stopped after 3 minute')
        break
    
    temperature, humidity, soil_moisture, led, fan, water = get_sensor_data()
    data = {'temperature':temperature, 'humidity':humidity, 'soil_moisture':soil_moisture, 'led':led, 'fan':fan, 'water':water}
    try:
        response = requests.post(url, json=data)
        if response.status_code == 200:
            print(f'Data Sent: {data}')
        else:
            print(f'Error: {response.status_code} - {response.text}')
        print(response.text)
    except requests.RequestException as e:
        print(f'Network Error : {e}')
        
    time.sleep(5)
