function UpdateReport(report){
	let report_table = document.getElementById('results_output');
	while(report_table.rows.length>0){
		report_table.deleteRow(0);
	} 

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
		let penalty = 0;
		for(let i=0; i<report.stages.length; ++i){
			let stage = report.stages[i];
			if(stage.params.action == 'target'){
				target_stage_time += (stage.end-stage.start);
				for(let t=0; t<stage.returns.length; ++t){
					let t_return = stage.returns[t];
					let t_time = t_return.response ? t_return.response.hit_time : null;
					if(t_time === 0){
						++misses;
						penalty += (stage.params.penalty*1);
						target_time += (stage.params.duration*1);
						target_sample_variance += OverVariance(t_return.response)['max'];
					}else if(t_time === null){
						//failed call
						target_time += (stage.params.duration*1);
					}else{
						target_time += t_time;
						let over_variance = OverVariance(t_return.response);
						target_hit_variance += over_variance['hit'];
						target_sample_variance += over_variance['max'];
					}
				}
			}
		}

		table.appendChild(CreateRow([CreateLabel('Misses')
											,CreateText('misses',misses,true)]));
		table.appendChild(CreateRow([CreateLabel('Penalty')
											,CreateText('penalty',FormatTimeMilli(penalty),true)]));
		table.appendChild(CreateRow([CreateLabel('Overall')
											,CreateText('overall',FormatTimeMilli(overall_time),true)]));
		table.appendChild(CreateRow([CreateLabel('Target Stage Time')
											,CreateText('target_stage_time',FormatTimeMilli(target_stage_time),true)]));
		table.appendChild(CreateRow([CreateLabel('Target Time')
											,CreateText('target_time',FormatTimeMilli(target_time),true)]));
		table.appendChild(CreateRow([CreateLabel('Hit Variance')
									,CreateText('hit_variance',FormatTimeMicro(target_hit_variance),true)]));
		table.appendChild(CreateRow([CreateLabel('Sample Variance')
									,CreateText('sample_variance',FormatTimeMicro(target_sample_variance),true)]));

		report_table.appendChild(CreateRow([table]));
	}
	
	function StageReport(stage){
		let table = document.createElement('table');
		table.classList.add('stage');
		
		let stage_time = stage.end-stage.start;
		
		table.appendChild(CreateRow([CreateLabel('Action'),CreateText('action',stage.params.action,true)]));
		table.appendChild(CreateRow([CreateLabel('Stage Time')
					,CreateText('stage_time',FormatTimeMilli(stage_time),true)]));
		
		
		if(stage.params.action == 'target'){
			let targets = document.createElement('div');
			let misses = 0;
			let penalty = 0;
			let target_time = 0;
			let target_hit_variance = 0;
			let target_sample_variance = 0;
			
			targets.classList.add('stage_target_stats');
						
			for(let t=0; t<stage.returns.length; ++t){
				let t_return = stage.returns[t];
				let t_time = t_return.response ? t_return.response.hit_time : null;
				if(t_time === 0){
					++misses;
					penalty += (stage.params.penalty*1);
					target_time += (stage.params.duration*1);
					let over_variance = OverVariance(t_return.response);
					let title = 'ip:' + t_return.ip + ', sample_variance:' + FormatTimeMicro(over_variance['max']);
					targets.appendChild(CreateLabel(FormatTimeMilli(stage.params.duration*1),'target_miss', title));
					target_sample_variance += over_variance['max'];
				}else if(!t_time){
					//failed call
					target_time += (stage.params.duration*1);
					let title = 'ip:' + t_return.ip;
					targets.appendChild(CreateLabel(FormatTimeMilli(stage.params.duration*1),'target_failed', title));
				}else{
					target_time += t_time;
					let over_variance = OverVariance(t_return.response);
					let title = 'ip:' + t_return.ip + 
									', sample_variance:' + FormatTimeMicro(over_variance['max']) + 
									', hit_variance:' + FormatTimeMicro(over_variance['hit']) +
									', x:' + t_return.response.x +
									', y:' + t_return.response.y +
									', z:' + t_return.response.z;
					targets.appendChild(CreateLabel(FormatTimeMilli(t_time),'target_hit', title));
					target_hit_variance += over_variance['hit'];
					target_sample_variance += over_variance['max'];
				}
			}

			table.appendChild(CreateRow([CreateLabel('Misses')
									,CreateText('stage_misses',misses,true)]));
			table.appendChild(CreateRow([CreateLabel('Penalty')
									,CreateText('stage_penalty',FormatTimeMilli(penalty),true)]));
			table.appendChild(CreateRow([CreateLabel('Target Time')
									,CreateText('target_time',FormatTimeMilli(target_time),true)]));
			table.appendChild(CreateRow([CreateLabel('Hit Variance')
									,CreateText('hit_variance',FormatTimeMicro(target_hit_variance),true)]));
			table.appendChild(CreateRow([CreateLabel('Sample Variance')
									,CreateText('sample_variance',FormatTimeMicro(target_sample_variance),true)]));
			table.appendChild(CreateRow([CreateLabel('Targets'),targets]));
					
		}
		
		report_table.appendChild(CreateRow([table]));
	}
	
	OverallReport();
	for(let i=0; i<report.stages.length; ++i){
		StageReport(report.stages[i]);
	}
	
}
