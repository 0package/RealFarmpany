import argparse
import glob
import importlib
import os
import uvicorn
import requests
import sqlite3

# SQL #############################################################################################################
#connect db
conn = sqlite3.connect("farm.db",check_same_thread=False)
cursor = conn.cursor()

cursor.execute('''
create table if not exists farm_info(
    id integer primary key,
    farm_id integer,
    plant text,
    auto integer,
    duration integer
)               
''')

cursor.execute('''
create table if not exists device_status(
    id integer primary key,
    led integer,
    fan integer,
    cooler integer,
    water integer,
    heat integer
)
''')

cursor.execute('''
create table if not exists sensor_opt(
    id integer primary key,
    tmin integer,
    tmax integer,
    hmin integer,
    hmax integer,
    smin integer,
    smax integer,
    cmin integer,
    cmax integer
)               
''')


#init tables
cursor.execute("select count(*) from device_status")
if cursor.fetchone()[0] == 0:
    cursor.execute("insert into farm_info (id, farm_id, auto, duration) values (0,34,1,0)")
    cursor.execute("insert into device_status (id, led, fan, cooler, water, heat) values (0,0,0,0,0,0)")
    cursor.execute("insert into sensor_opt (id, tmin, tmax, hmin, hmax, cmin, cmax, smin, smax) values (0, 15,20,60,70,65,80,800,1200)")
    conn.commit()
    
    
#query


# Attibutes #################################################################

# web server url
url = "https://port-0-server-m7tucm4sab201860.sel4.cloudtype.app"

#control devices status
cdata = {"led":0, "fan":0, "cooler":0, "water":0, "heater":0}




#user_id = "user@gmail.com"
farm_id = 34


# Create App ################################################################
if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Summer local server runner')
    parser.add_argument('--module', help='root module name. optional.', type=str, default=None, required=False)
    parser.add_argument('--port', help='port, default 8000, optional.', type=int, default=8000, required=False)
    parser.add_argument('--no-reload',
                        help='disable automatic reload when a code changes. optional',
                        required=False,
                        action='store_true')
    args = parser.parse_args()
    module_name = args.module
    if not module_name:
        yml_path = 'config/properties.yml'
        module_name = None
        for d in filter(lambda f: os.path.isdir(f), glob.glob('*')):
            if os.path.isfile(f'{d}/{yml_path}'):
                module_name = d
                break
    print(f"module_name : {module_name}")
    module = importlib.import_module(module_name)
    app =  getattr(module, 'create_app')()

# API #######################################################################

# API test (get)
    @app.get("/")
    def read_root():
        return {"message":"Hello, FastAPI on Raspberry Pi!"}

    @app.get("/status")
    def get_status():
        cursor.execute("select * from device_status where id = 0")
        return cursor.fetchone()

    @app.get("/lev")
    def level_min_max():
        cursor.execute("select * from sensor_opt where id = 0")
        return cursor.fetchone()

# API - web (post)

#device status changed
    @app.post("/update")
    def update_status(update: dict):
        print('sign onononon')
        global farm_id
        changed={}
        if update["farm_id"] == farm_id:
            print("it's you")
            cursor.execute("update farm_info set auto = 0 where id = 0")
            conn.commit()
            cursor.execute("select auto from farm_info where id = 0")
            print("auto:",cursor.fetchone())
            chkey = update["devices"]
            value = update["status"]
            duration = update["duration"]
            cursor.execute(f"update farm_info set duration = {duration} where id = 0")
            conn.commit()
            cursor.execute(f"select {chkey} from device_status where id = 0")
            res = cursor.fetchone()
            
            if res[0] != value:
                cursor.execute(f"update device_status set {chkey} = {value} where id = 0")
                conn.commit()
                changed[chkey] = value

            if changed:
                try:
                    requests.post(url, json=changed)
                except requests.exceptions.RequestException as e:
                    print(f"Node server failed: {e}")

            return {"message":"Updated", "changed":changed}
        else:
            print("who are you?")

# init farm
    @app.post("/init-farm-data")
    def init_farm(ini_data: dict):
        farm_id = ini_data["farm_id"]
        plant = ini_data["farm_type"]
        tminmax = ini_data["conditions"]["temperature"]
        hminmax = ini_data["conditions"]["humidity"]
        sminmax = ini_data["conditions"]["soil_moisture"]
        cminmax = ini_data["conditions"]["co2"]
        
        print("farm_id", farm_id, "plant", plant, "tminmax", tminmax, "hminmax", hminmax)

        cursor.execute("update farm_info set farm_id = ? where id = 0", (farm_id,))
        cursor.execute("update farm_info set plant = ? where id = 0", (plant,))
        cursor.execute("update sensor_opt set tmin = ? where id = 0", (tminmax["optimal_min"],))
        cursor.execute("update sensor_opt set tmax = ? where id = 0", (tminmax["optimal_max"],))
        cursor.execute("update sensor_opt set hmin = ? where id = 0", (hminmax["optimal_min"],))
        cursor.execute("update sensor_opt set hmax = ? where id = 0", (hminmax["optimal_min"],))
        cursor.execute("update sensor_opt set smin = ? where id = 0", (sminmax["optimal_min"],))
        cursor.execute("update sensor_opt set smax = ? where id = 0", (sminmax["optimal_min"],))
        cursor.execute("update sensor_opt set cmin = ? where id = 0", (cminmax["optimal_min"],))
        cursor.execute("update sensor_opt set cmax = ? where id = 0", (cminmax["optimal_min"],))
        conn.commit()

        return {"message":"good", "t":tminmax, "h":hminmax, "s":sminmax, "c":cminmax}

# sensor min-max value changed
    @app.post("/level")
    def update_level(update: dict):
        cursor.execute("update device_status set tmin = ?", (update["temperature"]["optimal_min"],))
        cursor.execute("update device_status set tmax = ?", (update["temperature"]["optimal_max"],))
        cursor.execute("update device_status set hmin = ?", (update["humidity"]["optimal_min"],))
        cursor.execute("update device_status set hmax = ?", (update["humidity"]["optimal_max"],))
        cursor.execute("update device_status set smin = ?", (update["soil_moisture"]["optimal_min"],))
        cursor.execute("update device_status set smax = ?", (update["soil_moisture"]["optimal_max"],))
        cursor.execute("update device_status set cmin = ?", (update["co2"]["optimal_min"],))
        cursor.execute("update device_status set cmax = ?", (update["co2"]["optimal_max"],))
       
        conn.commit()
        return {"message": "update level"}



    reload = True if args.no_reload is None else False

    uvicorn.run(app, host='0.0.0.0', port=args.port, reload=reload)
