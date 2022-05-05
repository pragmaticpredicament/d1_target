#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <Adafruit_ADXL345_U.h>
#include <Wire.h>
#include <FS.h>

typedef unsigned long micro_t;

Adafruit_ADXL345_Unified accel = Adafruit_ADXL345_Unified(12345);

ESP8266WebServer server(80);

const String ssid = "TARGET_NET";
const String wpass = "d1miniii"; //password 8 chars
const String wmode = "infra";

IPAddress local_IP(192,168,4,205);
IPAddress gateway(192,168,4,1);
IPAddress subnet(255,255,255,0);

#define LED_RED_1	  D0
#define LED_RED_2	  D7
#define LED_GREEN_1 D4
#define LED_GREEN_2 D6
#define LED_BLUE_1  D5
#define LED_BLUE_2  D8

void setLed(char c){
	digitalWrite(LED_BUILTIN, (c=='a' || c=='i') ? LOW : HIGH);
	
	if(c=='a'){
		c='w';
	}
	
	//'w' = white
	if(c=='w' || c=='r'){
		digitalWrite(LED_RED_1, LOW);
		digitalWrite(LED_RED_2, LOW);
	}else{
		digitalWrite(LED_RED_1, HIGH);
		digitalWrite(LED_RED_2, HIGH);
	}
	
	if(c=='w' || c=='g'){
		digitalWrite(LED_GREEN_1, LOW);
		digitalWrite(LED_GREEN_2, LOW);
	}else{
		digitalWrite(LED_GREEN_1, HIGH);
		digitalWrite(LED_GREEN_2, HIGH);
	}
	
	if(c=='w' || c=='b'){
		digitalWrite(LED_BLUE_1, LOW);
		digitalWrite(LED_BLUE_2, LOW);
	}else{
		digitalWrite(LED_BLUE_1, HIGH);
		digitalWrite(LED_BLUE_2, HIGH);
	}
}

//all
//internal
//white
//red
//green
//blue
void setLed(const String &s){
	if(s.isEmpty()){
		setLed('x');
	}
	setLed(tolower(s[0]));
}

void handleBlink() {
	int blink_count=0;
	int blink_on=500;
	int blink_off=500;
	String blink_color="green";
	
	if(server.hasArg("count")){
		blink_count=server.arg("count").toInt();
	}
	if(server.hasArg("on")){
		blink_on=server.arg("on").toInt();
	}
	if(server.hasArg("off")){
		blink_off=server.arg("off").toInt();
	}
	if(server.hasArg("color")){
		blink_color=server.arg("color");
	}
	
	for(int i=0;i<blink_count;++i){
		setLed(blink_color);
		delay(blink_on);
		setLed('x');
		delay(blink_off);
	}

	String json = "{\"blinked\":true}\n";
	server.sendHeader("Access-Control-Allow-Origin", "*");
	server.send(200, "application/json", json);
}

void handleTarget() {
	float x_trigger = 40;
	float y_trigger = 40;
	float z_trigger = 40;
	int x_value = 0;
	int y_value = 0;
	int z_value = 0;
	micro_t run_duration = 1000000;
	micro_t sample_interval = ceil(1000000 / 800);
	int sample_count = 0;
	
	if(server.hasArg("duration")){
		run_duration=server.arg("duration").toInt()*1000;
	}
	if(server.hasArg("g")){
		x_trigger=y_trigger=z_trigger=server.arg("g").toFloat();
	}
	if(server.hasArg("x")){
		x_trigger=server.arg("x").toFloat();
	}
	if(server.hasArg("y")){
		y_trigger=server.arg("y").toFloat();
	}
	if(server.hasArg("z")){
		z_trigger=server.arg("z").toFloat();
	}
	
	sensors_event_t event;
	micro_t rollover_addition = 0;
	micro_t start = micros();
	micro_t last = start;
	micro_t bucket = start / sample_interval;
	micro_t hit_time = 0;
	micro_t hit_interval = 0;
	micro_t max_interval = 0;
	
	setLed('b');
	while(true){
		micro_t curr = micros();
		accel.getEvent(&event);
		++sample_count;
		if(curr < start){
			rollover_addition = std::numeric_limits<micro_t>::max() - start;
			start = 0;
		}
		bucket = curr / sample_interval;
		
		if(abs(event.acceleration.x) > x_trigger
					|| abs(event.acceleration.y) > y_trigger
					|| abs(event.acceleration.z) > z_trigger ){
			hit_time= (curr - start) + rollover_addition;
			if(curr < last){
				 hit_interval = curr + (std::numeric_limits<micro_t>::max()-last);
			}else{
				 hit_interval = curr-last;
			}
			
			x_value = abs(floor(event.acceleration.x));
			y_value = abs(floor(event.acceleration.y));
			z_value = abs(floor(event.acceleration.z));
			break;
		}
		if(curr < last){
			max_interval = max(max_interval,curr + (std::numeric_limits<micro_t>::max()-last));
		}else{
			max_interval = max(max_interval,curr-last);
		}
		last = curr;
		
		if(((curr-start)+rollover_addition) >= run_duration){
		 	break;
		}
		
		yield(); //let esp8266 handle tcp/wifi
		curr = micros();
		if(curr < start){
			rollover_addition = std::numeric_limits<micro_t>::max() - start;
			start = 0;
		}

		micro_t curr_bucket = curr / sample_interval;
		if(curr_bucket == bucket){
			delayMicroseconds(sample_interval - curr%sample_interval);
		}
		bucket = micros() / sample_interval;
	} 
	String json;
	json += "{\"x\":" + String(x_value) + ",";
	json += "\"y\":" + String(y_value) + ",";
	json += "\"z\":" + String(z_value) + ",";
	json += "\"hit_time\":" + String(floor(hit_time/1000)) + ",";
   json += "\"hit_interval\":" + String(hit_interval) + ",";
	json += "\"max_interval\":" + String(max_interval) + ",";
	json += "\"sample_interval\":" + String(sample_interval) + ",";
	json += "\"samples\":" + String(sample_count) + ",";
	json += "\"expected_samples\":" + String((micros()-start)/sample_interval) + "}\n";
	server.sendHeader("Access-Control-Allow-Origin", "*");
	server.send(200, "application/json", json);
	if(hit_time == 0){
		setLed('r');
	}else{
		setLed('g');
	}
	delay(1000);
	setLed('x');
}

void handleMaxG() {
	int run_duration = 1000000;
	int sample_interval = ceil(1000000 / 800);
	int sample_count = 0;
	bool console = false;
	
	if(server.hasArg("duration")){
		run_duration=server.arg("duration").toInt()*1000;
	}
	if(server.hasArg("console")){
		console = true;
	}
	
	sensors_event_t event; 
	float max_x = 0;
	float max_y = 0;
	float max_z = 0;

	micro_t rollover_addition = 0;
	micro_t start = micros();
	micro_t last = start;
	micro_t max_interval = 0;
	micro_t bucket = start / sample_interval;
		
	setLed('b');
	while(true){
		micro_t curr = micros();
		accel.getEvent(&event);
		++sample_count;
		if(curr < start){
			rollover_addition = std::numeric_limits<micro_t>::max() - start;
			start = 0;
		}
		bucket = curr / sample_interval;
		
		if(curr < last){
			max_interval = max(max_interval,curr + (std::numeric_limits<micro_t>::max()-last));
		}else{
			max_interval = max(max_interval,curr-last);
		}
		last = curr;
		
		max_x = max(max_x,abs(event.acceleration.x));
		max_y = max(max_y,abs(event.acceleration.y));
		max_z = max(max_z,abs(event.acceleration.z));
		
		if(console){
			Serial.print(micros()); 
			Serial.print(" x:");
			Serial.print(String(event.acceleration.x,3));
			Serial.print(" y:");
			Serial.print(String(event.acceleration.y,3));
			Serial.print(" z:");
			Serial.print(String(event.acceleration.z,3));
			Serial.println(); 
		}
		
		if(((curr-start)+rollover_addition) >= run_duration){
		 	break;
		}
		
		yield();	//let esp8266 handle tcp/wifi
		curr = micros();
		if(curr < start){
			rollover_addition = std::numeric_limits<micro_t>::max() - start;
			start = 0;
		}
				
		micro_t curr_bucket = curr / sample_interval;
		if(curr_bucket == bucket){
			delayMicroseconds(sample_interval - curr%sample_interval);
		}
	} 
	String json;
	json += "{\"x\":" + String(floor(max_x)) + ",";
	json += "\"y\":" + String(floor(max_y)) + ",";
	json += "\"z\":" + String(floor(max_z)) + ",";
	json += "\"max_interval\":" + String(max_interval) + ",";
	json += "\"sample_interval\":" + String(sample_interval) + ",";
	json += "\"samples\":" + String(sample_count) + ",";
	json += "\"expected_samples\":" + String(run_duration/sample_interval) + "}\n";
	setLed('x');
	server.sendHeader("Access-Control-Allow-Origin", "*");
	server.send(200, "application/json", json);
}

void handleChangeNetwork(){
	String type = "infrastructure"; //or ad-hoc
	String hostname = "opentarget";
	String ssid;
	String password;

	if(server.hasArg("type")){
		type=server.arg("type");
	}
	if(server.hasArg("hostname")){
		hostname=server.arg("hostname");
	}
	if(server.hasArg("ssid")){
		ssid=server.arg("ssid");
	}
	if(server.hasArg("password")){
		password=server.arg("password");
	}

	if(type == "infrastructure"){
		WiFi.mode(WIFI_STA);
		if(!hostname.isEmpty()){
			WiFi.hostname(hostname);
		}
		WiFi.begin(ssid, password);
		while (WiFi.status() != WL_CONNECTED) {
			delay(500);
			Serial.print(".");
		}
		Serial.print("infrastructure ip: ");
		Serial.println(WiFi.localIP()); 
	} else if (type == "ad-hoc" || type == "adhoc") {
		WiFi.softAP(ssid, password, 1, false, 8); //ssid, password, channel, hidden, max connections (8 is max)
		if(!hostname.isEmpty()){
			WiFi.hostname(hostname);
		}
		while (WiFi.status() != WL_CONNECTED) {
			delay(500);
			Serial.print(".");
		}
		Serial.print("ad-hoc ip: ");
		Serial.println(WiFi.softAPIP());
	}
}

void setup() 
{
	pinMode(LED_BUILTIN, OUTPUT);
	pinMode(LED_RED_1,   OUTPUT);
	pinMode(LED_RED_2,   OUTPUT);
	pinMode(LED_GREEN_1,	OUTPUT);
	pinMode(LED_GREEN_2,	OUTPUT);
	pinMode(LED_BLUE_1,  OUTPUT);
	pinMode(LED_BLUE_2,  OUTPUT);

	setLed('x');

	Serial.begin(115200);

	if(!accel.begin())
	{
		Serial.println("No ADXL345 detected");
		return;
	}
	
	if (!SPIFFS.begin()) //mount the file system
	{
		Serial.println("Failed to mount file system");
		return;
	}

	accel.setRange(ADXL345_RANGE_16_G);
	// accel.setRange(ADXL345_RANGE_8_G);
	// accel.setRange(ADXL345_RANGE_4_G);
	// accel.setRange(ADXL345_RANGE_2_G);
	
	//accel.setDataRate(ADXL345_DATARATE_1600_HZ);
	accel.setDataRate(ADXL345_DATARATE_800_HZ);
	//accel.setDataRate(ADXL345_DATARATE_400_HZ);
	//accel.setDataRate(ADXL345_DATARATE_200_HZ);
	//accel.setDataRate(ADXL345_DATARATE_200_HZ);

	WiFi.hostname("shootme");
	if(wmode == "infra"){
		WiFi.mode(WIFI_STA);
		WiFi.begin(ssid, wpass);
		while (WiFi.status() != WL_CONNECTED) {
			delay(500);
			Serial.print(".");
		}
		Serial.println(WiFi.localIP()); 
	}else{
		WiFi.softAPConfig(local_IP, gateway, subnet);
		WiFi.softAP(ssid, wpass, 1, false, 8);
		Serial.print("AP IP address: ");
		Serial.println(WiFi.softAPIP());
	}
 
	server.on("/target", HTTP_GET, handleTarget);
	server.on("/blink", HTTP_GET, handleBlink);
	server.on("/max", HTTP_GET, handleMaxG);
	server.on("/change", HTTP_GET, handleChangeNetwork);
	
	server.serveStatic("/", SPIFFS, "/index.html");
	server.serveStatic("/game.js", SPIFFS, "/game.js");
	server.serveStatic("/detector.js", SPIFFS, "/detector.js");
	server.serveStatic("/actions.js", SPIFFS, "/actions.js");
	server.serveStatic("/report.js", SPIFFS, "/report.js");

	server.begin();
	
	Wire.setClock(800000L);
	
	setLed('g');
}
 
void loop() {
	server.handleClient();
}
