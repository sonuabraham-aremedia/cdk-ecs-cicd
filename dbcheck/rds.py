import pymysql
import os
Database_endpoint = os.environ['ENDPOINT']
Username = os.environ['USER']
Password = os.environ['PASS']
try:
  print("Connecting to " + Database_endpoint)
  db = pymysql.connect(host = Database_endpoint, user = Username, password = Password)
  print("Connection successful to " + Database_endpoint)
  db.close()
except Exception as e:
  print("Connection unsuccessful due to " + str(e))