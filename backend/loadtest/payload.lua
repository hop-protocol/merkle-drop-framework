wrk.method = "GET"
-- wrk.headers["Content-Type"] = "application/json"
-- wrk.body = '{}'
-- wrk.headers["X-Forwared-For"] = "127.0.0.1"

logfile = io.open("wrk.log", "w")

response = function(status, header, body)
  str = "status:" .. status .. "\n" .. body .. "\n-------------------------------------------------\n"
  print(str)
  logfile:write(str);
end
