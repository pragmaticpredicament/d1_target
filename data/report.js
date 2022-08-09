function UpdateReport(report){

	function FormatTimeMilli(time_ms){
		let seconds = time_ms/1000;
		return seconds.toFixed(3);
	}

	function FormatTimeMicro(time_ms){
		let seconds = time_ms/1000000;
		return seconds.toFixed(6);
	}


	function OverVariance(response){
		let sample_interval = response.sample_interval;
		let max_interval = response.max_interval;
		let hit_interval = response.hit_interval;
		
		return {
			'max' : max_interval > sample_interval ? max_interval - sample_interval : 0,
			'hit' : hit_interval > sample_interval ? hit_interval - sample_interval : 0,
		}
	}

	function OverallReport(){
		let table = document.createElement('table');
		table.classList.add('overall');
		
		let overall_time = report.overall.end - report.overall.start;
		let target_stage_time = 0;
		let target_time = 0;
		let target_hit_variance = 0;
		let target_sample_variance = 0;
		
		let misses = 0;
		let noshoots = 0;
		for(let i=0; i<report.stages.length; ++i){
			let stage = report.stages[i];
			if(stage.params.action == 'target'){
				target_stage_time += (stage.end-stage.start);
				for(let t=0; t<stage.returns.length; ++t){
					let t_return = stage.returns[t];
					let t_time = t_return.response ? t_return.response.hit_time : null;
					if(t_time === 0){
						if(!t_return.request.params.noshoot){
							++misses;
							target_time += (stage.params.duration*1);
							target_sample_variance += OverVariance(t_return.response)['max'];
						}
					}else if(t_time === null){
						//failed call
						target_time += (stage.params.duration*1);
					}else{
						if(t_return.request.params.noshoot){
							++noshoots;
						}else{
							target_time += t_time;
							let over_variance = OverVariance(t_return.response);
							target_hit_variance += over_variance['hit'];
							target_sample_variance += over_variance['max'];
						}
					}
				}
			}
		}

		table.appendChild(CreateRow([CreateLabel('Target Time')
											,CreateText('target_time',FormatTimeMilli(target_time),true)]));
		table.appendChild(CreateRow([CreateLabel('Misses')
											,CreateText('misses',misses,true)]));
		table.appendChild(CreateRow([CreateLabel('NoShoots')
											,CreateText('noshoots',noshoots,true)]));
		table.appendChild(CreateRow([CreateLabel('Target Stage Time','minor_metric')
											,CreateText('target_stage_time',FormatTimeMilli(target_stage_time),true)]));
		table.appendChild(CreateRow([CreateLabel('Overall','minor_metric')
											,CreateText('overall',FormatTimeMilli(overall_time),true)]));
		table.appendChild(CreateRow([CreateLabel('Hit Variance','minor_metric')
									,CreateText('hit_variance',FormatTimeMicro(target_hit_variance),true)]));
		table.appendChild(CreateRow([CreateLabel('Sample Variance','minor_metric')
									,CreateText('sample_variance',FormatTimeMicro(target_sample_variance),true)]));

		report_table.appendChild(CreateRow([table]));
	}
	
	function StageReport(stage){
		let table = document.createElement('table');
		table.classList.add('stage');
		
		let stage_time = stage.end-stage.start;
		
		
		if(stage.params.action == 'target'){
			let targets = document.createElement('div');
			let misses = 0;
			let noshoots = 0;
			let target_time = 0;
			let target_hit_variance = 0;
			let target_sample_variance = 0;
			
			targets.classList.add('stage_target_stats');
						
			for(let t=0; t<stage.returns.length; ++t){
				let t_return = stage.returns[t];
				let t_time = t_return.response ? t_return.response.hit_time : null;
				if(t_time === 0){
					let over_variance = OverVariance(t_return.response);
					let title = 'ip:' + t_return.request.ip + ', sample_variance:' + FormatTimeMicro(over_variance['max']);
					target_sample_variance += over_variance['max'];
											
					if(t_return.request.params.noshoot){
						targets.appendChild(CreateLabel(FormatTimeMilli(stage.params.duration*1),'target_noshoot_miss', title));
					}else{
						++misses;
						target_time += (stage.params.duration*1);
						targets.appendChild(CreateLabel(FormatTimeMilli(stage.params.duration*1),'target_miss', title));
					}
				}else if(!t_time){
					//failed call
					target_time += (stage.params.duration*1);
					let title = 'ip:' + t_return.request.ip;
					targets.appendChild(CreateLabel(FormatTimeMilli(stage.params.duration*1),'target_failed', title));
				}else{
					let over_variance = OverVariance(t_return.response);
					let title = 'ip:' + t_return.request.ip + 
									', sample_variance:' + FormatTimeMicro(over_variance['max']) + 
									', hit_variance:' + FormatTimeMicro(over_variance['hit']) +
									', x:' + t_return.response.x +
									', y:' + t_return.response.y +
									', z:' + t_return.response.z;
					target_hit_variance += over_variance['hit'];
					target_sample_variance += over_variance['max'];
					if(t_return.request.params.noshoot){
						++noshoots;
						targets.appendChild(CreateLabel(FormatTimeMilli(t_time),'target_noshoot_hit', title));
					}else{
						target_time += t_time;
						targets.appendChild(CreateLabel(FormatTimeMilli(t_time),'target_hit', title));
					}
				}
			}

		   table.appendChild(CreateRow([CreateLabel('Action')
		                     ,CreateText('action',stage.params.action,true)]));
		   table.appendChild(CreateRow([CreateLabel('Target Time')
									,CreateText('target_time',FormatTimeMilli(target_time),true)]));
			table.appendChild(CreateRow([CreateLabel('Misses')
									,CreateText('stage_misses',misses,true)]));
			table.appendChild(CreateRow([CreateLabel('NoShoots')
									,CreateText('stage_noshoots',noshoots,true)]));
		   table.appendChild(CreateRow([CreateLabel('Stage Time','minor_metric')
					            ,CreateText('stage_time',FormatTimeMilli(stage_time),true)]));
			table.appendChild(CreateRow([CreateLabel('Hit Variance','minor_metric')
									,CreateText('hit_variance',FormatTimeMicro(target_hit_variance),true)]));
			table.appendChild(CreateRow([CreateLabel('Sample Variance','minor_metric')
									,CreateText('sample_variance',FormatTimeMicro(target_sample_variance),true)]));
			table.appendChild(CreateRow([CreateLabel('Targets','minor_metric'),targets]));
					
		}
		
		stage_table.appendChild(CreateRow([table]));
	}

	let report_table = document.getElementById('results_output');
	let stage_table = document.getElementById('stage_output');
	while(report_table.rows.length>0){
		report_table.deleteRow(0);
	} 	
	while(stage_table.rows.length>0){
		stage_table.deleteRow(0);
	} 	
		
	OverallReport();
	

	for(let i=0; i<report.stages.length; ++i){
		StageReport(report.stages[i]);
	}
	
}
