
function PopulateDetector(){
	let table = document.getElementById('detect');
	table.appendChild(CreateRow([CreateLabel('Expected Targets'),CreateNumber('detect_target_num', 8)]));
	table.appendChild(CreateRow([CreateLabel('Subnet Prefix'),CreateText('detect_target_subnet', '192.168.8.')]));
	table.appendChild(CreateRow([CreateLabel('Subnet Start'),CreateText('detect_target_start', 230)]));
	table.appendChild(CreateRow([CreateLabel('Subnet End'),CreateText('detect_target_end', 254)]));
	table.appendChild(CreateRow([CreateLabel('Target Timeout'),CreateText('detect_target_timeout', 3000)]));
	table.appendChild(CreateRow([CreateLabel('Concurrent Detection'),CreateText('detect_target_concurrent', 32)]));
	table.appendChild(CreateRow([CreateButton('add_ip','Manualy Add IP',ManuallyAddIP),CreateText('detect_target_manual_ip', '192.168.1.1')]));
	//table.appendChild(CreateRow([CreateButton('detect_targets','Detect Targets',DetectTargets)]));
}

function MaxGTarget(){
   let button = this;
   let text = this.parentNode.nextSibling.firstChild;
   button.disabled = true;
   
   function ShowMaxG(response, request){
   	button.disabled = false;
   	if(response){
   		text.value = "X=" + response.x +
   		                    ", Y=" + response.y + 
   		                    ", Z=" + response.z;
   	}else{
   		text.value = "failed";
   	}
   };
   
	RunRequest({
		'ip':this.textContent,
      'command':'max',
      'params':{'duration':3000}
      }, ShowMaxG);
}

function ClearTargets(){
	let table = document.getElementById('targets');
	while(table.rows.length>0){
		table.deleteRow(0);
	} 
	TARGET_IPS = [];
}

function AddTarget(ip){
	if(-1 != TARGET_IPS.indexOf(ip)){
		return;
	}
	let table = document.getElementById('targets');
	table.appendChild(CreateRow([CreateButton('detected_ip',ip,MaxGTarget)
	                            ,CreateText('max','max: (not run)',true)]));
	TARGET_IPS.push(ip);
}

function ManuallyAddIP(){
	AddTarget(document.getElementsByName('detect_target_manual_ip')[0].value);
}

function DetectTargets(detect_button){
	let expected_targets = document.getElementsByName('detect_target_num')[0].value * 1;
	let subnet_prefix = document.getElementsByName('detect_target_subnet')[0].value;
	let target_timeout = document.getElementsByName('detect_target_timeout')[0].value * 1;
	let concurrent = document.getElementsByName('detect_target_concurrent')[0].value * 1;
	let next_value = document.getElementsByName('detect_target_start')[0].value * 1;
	let end_value = document.getElementsByName('detect_target_end')[0].value * 1;
	
	detect_button.disabled = true;
	
	function DetectReturn(response, request){
		if(response && response.blinked){
			--expected_targets;
			AddTarget(request.ip);
		}
		CheckNextIp();
   };
	
	function CheckNextIp(){
   	if(next_value > end_value || expected_targets <= 0){
   		detect_button.disabled = false;
   		return;
   	}
   	let next_try = subnet_prefix + next_value++;
		RunRequest({
				'ip':next_try,
	         'command':'blink',
	         'params':{'count':1,'on':100,'off':0,'color':'white'}
	         }, DetectReturn, target_timeout, CheckNextIp);
	}
	
	for(i=0; i<concurrent; ++i){
		CheckNextIp();
	}; 
}

PopulateDetector();
