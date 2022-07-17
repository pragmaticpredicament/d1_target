let TARGET_IPS = [];

let ADDITIONAL_TIMEOUT = 10000;

function shuffle(array) {
  var currentIndex = array.length,  randomIndex;
  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}

let OUTSTANDING_REQUESTS = []
function RunRequest(request, callback, timeout_val=0){
	if(ACTIONS_CANCELLED){
		return;
	}
	function ParamStr(arguments){
		let param_str = '';
		for (const [key, value] of Object.entries(arguments)) {
			if(param_str !== ''){
				param_str += '&';
			}
			param_str += key;
			param_str += '=';
			param_str += value;
		}
		return param_str;
	}

	function reqListener () {
		let json_response;
		try{
			json_response = JSON.parse(this.responseText);
		}catch(e){
			json_response = null;
		}
		callback(json_response, request);
	}

	let oReq = new XMLHttpRequest();
	oReq.onloadend = reqListener;
	oReq.open('GET', 'http://' + request.ip + '/' + request.command + '?' + ParamStr(request.params));
	oReq.send();
	if(timeout_val>0){
		oReq.timeout = timeout_val;
	}
	OUTSTANDING_REQUESTS.push(oReq)
}

function GetDelay(params){
	let delay=(1*params.delay) + Math.floor(Math.random() * ((1*params.random_delay) + 1));
	return(delay);
}

function Delay(params, remaining_actions, report){
	setTimeout(function(){ 
		PerformActions(remaining_actions, report);
	}, GetDelay(params));
}

function Blink(params, remaining_actions, report){
   let expected_returns = 0;

   function BlinkReturn(response, request){
   	--expected_returns;
   	if(response){
			report.stages[report.stages.length-1]['returns'].push({'ip':request.ip,'response':response});
		}else{
			report.stages[report.stages.length-1]['returns'].push({'ip':request.ip,'response':null});
		}
		
      if(expected_returns == 0){
         PerformActions(remaining_actions, report);
      }
   };

	TARGET_IPS.forEach(function(item,index){
	   ++expected_returns;
		RunRequest({
						'ip':item,
		            'command':'blink',
		            'params':params
		            }, BlinkReturn, 2 * (1*params.count) * (1*params.on + 1*params.off) + ADDITIONAL_TIMEOUT);
	}); 
}

function Target(params, remaining_actions, report){
	let target_timeout = params.result_show; //we need to account for the target showing the result (red/miss or green/hit) 
   let remaining = params.count;
	let current_ips = {};
	let oldest_target = null;
	let random_ips = shuffle([].concat(TARGET_IPS));
   let expected_returns = 0;
   let handled_cancel = false;
   
   if(!params.reuse){
   	remaining = Math.min(remaining,TARGET_IPS.length);
   }

   function RandomNotCurrent(){
   	//update current_ips;
   	oldest_target = null;
   	let curr = Date.now();
   	let current_keys = Object.keys(current_ips);
   	for(let i=0; i<current_keys.length; ++i){
   		let ip = current_keys[i];
   		if(current_ips[ip] == 0){
   			//target still running
   			continue; 
   		}else if((curr - current_ips[ip]) > target_timeout){
   			//target returned > timeout ago, eligable for reuse
   			delete(current_ips[ip]);
   		}else{
   			if(oldest_target === null){
   				oldest_target = current_ips[ip];
   			}else{
   				oldest_target = Math.min(oldest_target,current_ips[ip]);
   			}
   		}
   	}
   
		if(params.reuse){ //allow reuse of targets within target string
			random_ips = shuffle([].concat(TARGET_IPS));
		}
	}

	function FireRequests(){
		if(ACTIONS_CANCELLED){
			if(!handled_cancel){
				PerformActions(remaining_actions, report);
				handled_cancel = true;
			}
			return;
		}
	   RandomNotCurrent();
		while(random_ips.length>0 && remaining>0 && expected_returns<params.concurrent){
			let ip = random_ips.shift();
			if(ip in current_ips){
				continue;
			}
		
         ++expected_returns;
         --remaining;
         current_ips[ip] = 0; //0 means the request hasn't returned yet
		   RunRequest({
				'ip':ip,
				'command':'target',
				'params':params
				}, RequestReturn);
		}
		if(random_ips.length==0 && remaining>0 && expected_returns<params.concurrent){
			//there weren't enough targets that are not in use to serve the requested concurrency, sleep until some more are
			let sleep_time = target_timeout;
			let curr = Date.now();
			if(oldest_target !== null){
				sleep_time = target_timeout - (curr-oldest_target);
				sleep_time = Math.min(sleep_time, 0);
			}
			setTimeout(function(){ 
				FireRequests();
			}, sleep_time);
		}
	}
	
	function RequestReturn(response, request){
		if(ACTIONS_CANCELLED){
			if(!handled_cancel){
				PerformActions(remaining_actions, report);
				handled_cancel = true;
			}
			return;
		}
	
		--expected_returns;
		if(response){
			report.stages[report.stages.length-1]['returns'].push({'ip':request.ip,'response':response});
		}else{
			report.stages[report.stages.length-1]['returns'].push({'ip':request.ip,'response':null});
		}
		
		current_ips[request.ip] = Date.now();
		
		if(expected_returns > 0 && params.linked){
			return;		
		}
		if(remaining > 0){
			setTimeout(function(){ 
				FireRequests();
			}, GetDelay(params));
			UpdateReport(report);
		}else{
		   if(expected_returns==0){ //check to make sure last concurrent targets have all finished
		      //wait for last target to show hit/miss before continuing
		   	setTimeout(function(){ 
					PerformActions(remaining_actions, report);
				}, target_timeout);
			}		
		}
   };

	FireRequests();
}

let ACTIONS_CANCELLED = false;
function PerformActions(actions, report){
	OUTSTANDING_REQUESTS = []
	let curr_ms = Date.now();
   let run_button = document.getElementById('run_actions');
	run_button.disabled = true;
	
	if(!report){
		report = {
			overall:{start:curr_ms},
			stages:[]
		}
	}
	report.overall['end'] = curr_ms;
	
	if(report.stages.length > 0){
		report.stages[report.stages.length-1]['end'] = curr_ms;
	}

	if(actions.length > 0 && !ACTIONS_CANCELLED){
		curr = actions.shift();
		report.stages.push({
			'params':curr,
			'start':Date.now(),
			'end':Date.now(),
			'returns':[]});
		console.log(curr.action);
		switch(curr.action){
			case 'blink':
				Blink(curr,actions,report);
				break;
			case 'delay':
				Delay(curr,actions,report);
				break;
			case 'target':
				Target(curr,actions,report);
				break;
		}
	}else{
		run_button.disabled = false;
	}
	
	UpdateReport(report);
}

function CancelActions(){
	for(let i=0; i<OUTSTANDING_REQUESTS.length; ++i){
		OUTSTANDING_REQUESTS[i].abort()
	}
	ACTIONS_CANCELLED = true;
}
