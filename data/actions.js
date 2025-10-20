let ACTION_PARAMETERS = {
	'blink' : {
		'count' : {'unit' : 'int', 'label' : 'Count', 'default' : 3},
		'color' : {'unit' : 'color', 'label' : 'Color', 'default' : 'red'},
		'on' : {'unit' : 'millisecond', 'label' : 'On Time (ms)', 'default' : 500},
		'off' : {'unit' : 'millisecond', 'label' : 'Off Time (ms)', 'default' : 500}
	},
	'delay' : {
		'delay' : {'unit' : 'millisecond', 'label' : 'Time (ms)', 'default' : 1000},
		'random_delay' : {'unit' : 'millisecond', 'label' : 'Random Time (ms)', 'default' : 0}
	},
	'target' : {
		'count' : {'unit' : 'int', 'label' : 'Count', 'default' : 8},
		//reuse: this determines whether once a target has been light, if it can be shown again during this section.
		//if enabled, a target can be shown more than once in a target section.
		//if count > number of physical targets, reuse must be enabled 
		//if noshoot_percent > 0, reuse must be enabled or you could randomly freeze the game
		'reuse' : {'unit' : 'bool', 'label' : 'Reuse', 'default' : false},
	        //delay: introduce a delay of the given value. 	
		'delay' : {'unit' : 'millisecond', 'label' : 'Delay (ms)', 'default' : 0},
	        //random_delay: introduce a random delay of at most the given value. 
		//this will be added to the delay value above 	
		'random_delay' : {'unit' : 'millisecond', 'label' : 'Random Delay (ms)', 'default' : 0},
		//concurrent: the number of targets that will be shown at the same time 
		//(total of shoot + noshoot)	
		'concurrent' : {'unit' : 'int', 'label' : 'Concurrent', 'default' : 1},
		//linked: only relevant if concurrent > 1.
		//  if enabled, all members of the set of currently displayed targets must be engaged 
		//or timed out before another set of targets is displayed.  
		//  if disabled, a new target will display after any single target is hit
		'linked' : {'unit' : 'bool', 'label' : 'Link Concurrent', 'default' : true},
		'duration' : {'unit' : 'millisecond', 'label' : 'On Time (ms)', 'default' : 3000},
		'light' : {'unit' : 'millisecond', 'label' : 'On Time (ms)', 'default' : 3000},
		'g' : {'unit' : 'int', 'label' : 'G Trigger (tenths)', 'default' : 100},
		'result_show' : {'unit' : 'millisecond', 'label' : 'Result Show (ms)', 'default' : 1000},
		//noshoot_percent: the percentage chance that the next shown target will be a noshoot.
		'noshoot_percent' : {'unit' : 'int', 'label' : 'Noshoot Percent (%)', 'default' : 0},
		'noshoot_duration' : {'unit' : 'millisecond', 'label' : 'NoShoot Time (ms)', 'default' : 3000},
	        //color: the color of the targets you should try to hit	
		'color' : {'unit' : 'color', 'label' : 'Color', 'default' : 'blue'},
		//white_noshoot: removes white from noshoots.
		//  if red/green colorblind, you can set blue as targets and red/green as noshoots, 
		//but having white is impossible to delineate
		'white_noshoot' : {'unit' : 'bool', 'label' : 'White in Noshoot', 'default' : true} 
	}
}

function CreateButton(name, text, clickhandler){
	let button = document.createElement('button');
	button.name = name;
	button.onclick = clickhandler;
	button.appendChild(document.createTextNode(text));
	return button;
}

function AddRow(event){
	let action_row = this.parentElement.parentElement;
	let all_actions = action_row.parentElement;
	if (action_row.nextSibling) {
	  all_actions.insertBefore(CreateAction('blink'), action_row.nextSibling);
	}
	else {
	  all_actions.appendChild(CreateAction('blink'));
	}
}

function DeleteRow(event){
	let action_row = this.parentElement.parentElement;
	let all_actions = action_row.parentElement;
	if(all_actions.rows.length > 1){
		all_actions.removeChild(action_row);
	}
}

function CreateCheckbox(name, value){
   let checkbox = document.createElement('input');
	checkbox.type = 'checkbox';
	checkbox.name = name;
	checkbox.checked = value;
	return checkbox;
}

function CreateNumber(name, value){
	let number = document.createElement('input');
	number.type = 'number';
	number.name = name;
	number.value = value;
	return number;
}

function CreateText(name, value, disabled = false){
	let text = document.createElement('input');
	text.type = 'text';
	text.name = name;
	text.value = value;
	text.disabled = disabled;
	return text;
}

function CreateLabel(text, c=null, title=null){
    let label = document.createElement('label');
    label.textContent = text;
    if(c){
    	label.classList.add(c);
    }
    if(title){
    	label.title = title;
    }
    return label;
}

function CreateSelect(name, options, selected, change_handler=null){
    let select = document.createElement('select');
    for (let i = 0; i < options.length; i++) {
        let option = document.createElement("option");
        option.value = options[i];
        option.text = options[i];
        select.appendChild(option);
    }
    select.name = name;
    select.value = selected;
    select.onchange = change_handler;
	 return select;
}  

function CreateRow(elements){
	let tr = document.createElement('tr');
	for(let i=0; i<elements.length; ++i){
		let td = document.createElement('td');
   	td.appendChild(elements[i]);
   	tr.appendChild(td);
	}
   return tr;
}

function CreateParameters(key,table,state){
	let parameters = Object.keys(ACTION_PARAMETERS[key]);
	for(let i=0;i<parameters.length;++i){
		let attributes = ACTION_PARAMETERS[key][parameters[i]];
		let value = attributes.default;
		if (state !== undefined && state[parameters[i]] !== undefined){
			value = state[parameters[i]];
		}
		let input;
		switch(attributes.unit){
			case 'int':
			case 'millisecond':
			case 'char':
				input = CreateNumber(parameters[i], value);
				break;
			case 'color':
				input = CreateSelect('color',['red','green','blue','white','random','randomnowhite','lastblink'],value);
				break;
			case 'bool':
				input = CreateCheckbox(parameters[i], value);
				break;		
		}
		table.appendChild(CreateRow([CreateLabel(attributes.label),input]))
	}
}

function CreateAction(key,state){
	let table = document.createElement('table');
	table.classList.add('action');
	
	let colgroup = document.createElement('colgroup');
	let col1 = document.createElement('col');
	col1.classList.add('actioncol1');
	colgroup.appendChild(col1);
	let col2 = document.createElement('col');
	col2.classList.add('actioncol2');
	colgroup.appendChild(col2);
	table.append(colgroup);
	
	table.appendChild(CreateRow([CreateLabel('Action'),CreateSelect('action',Object.keys(ACTION_PARAMETERS),key, ChangeAction)]));
	CreateParameters(key,table,state)
	return CreateRow([table,CreateButton('add','+', AddRow),CreateButton('subtract','\u2212',DeleteRow)])
}

function ChangeAction(event){
   let select_row = this.parentElement.parentElement;
   let table = select_row.parentElement;
   let key = this.value;
	while(table.rows.length>1){
		table.deleteRow(1);
	} 
	CreateParameters(key,table);
	return;
}

function GetActionArray(){
	let actions = [];
   let action_tables = document.getElementById('actions').querySelectorAll('table');
   for(let i=0; i<action_tables.length; ++i){
   	let action = {};
   	let kv = action_tables[i].querySelectorAll('td:nth-child(2)');
   	for(let j=0; j<kv.length; ++j){
   		let value_node = kv[j].firstChild;
   		let value;
   		if(value_node.type == 'checkbox'){
   			value = value_node.checked;
   		}else{
   			value = value_node.value;
   		}
   		action[kv[j].firstChild.name] = value;
   	}
   	actions.push(action);
   }
   return actions;
}

//build object representation of action forms
function RunGame(){
	actions = GetActionArray();
 	ACTIONS_CANCELLED = false;
   PerformActions(actions);
	return;
}

function CancelGame(){
	CancelActions();
}

document.getElementById('actions').appendChild(CreateAction('target'));
document.getElementById('actions').appendChild(CreateAction('delay'));
document.getElementById('actions').appendChild(CreateAction('blink'));

let premade_games = {
	"1 at a time":[{"action":"blink","count":"3","color":"white","on":"500","off":"500"},{"action":"target","count":"8","reuse":false,"delay":"0","random_delay":"0","concurrent":"1","linked":true,"duration":"3000","light":"3000","g":"100","result_show":"1000","noshoot_percent":"0","noshoot_duration":"3000","color":"blue","white_noshoot":true},{"action":"blink","count":"3","color":"white","on":"500","off":"500"}],
	"2 at a time linked":[{"action":"blink","count":"3","color":"white","on":"500","off":"500"},{"action":"target","count":"8","reuse":false,"delay":"0","random_delay":"0","concurrent":"2","linked":true,"duration":"3000","light":"3000","g":"100","result_show":"1000","noshoot_percent":"0","noshoot_duration":"3000","color":"blue","white_noshoot":true},{"action":"blink","count":"3","color":"white","on":"500","off":"500"}],
	"2 at a time unlinked":[{"action":"blink","count":"3","color":"white","on":"500","off":"500"},{"action":"target","count":"8","reuse":false,"delay":"0","random_delay":"0","concurrent":"2","linked":false,"duration":"3000","light":"3000","g":"100","result_show":"1000","noshoot_percent":"0","noshoot_duration":"3000","color":"blue","white_noshoot":true},{"action":"blink","count":"3","color":"white","on":"500","off":"500"}],
	"3 at a time unlinked":[{"action":"blink","count":"3","color":"white","on":"500","off":"500"},{"action":"target","count":"8","reuse":false,"delay":"0","random_delay":"0","concurrent":"3","linked":false,"duration":"3000","light":"3000","g":"100","result_show":"1000","noshoot_percent":"0","noshoot_duration":"3000","color":"blue","white_noshoot":true},{"action":"blink","count":"3","color":"white","on":"500","off":"500"}],
	"3 at a time noshoots":[{"action":"blink","count":"3","color":"white","on":"500","off":"500"},{"action":"target","count":"8","reuse":true,"delay":"0","random_delay":"0","concurrent":"3","linked":false,"duration":"3000","light":"3000","g":"100","result_show":"1000","noshoot_percent":"60","noshoot_duration":"2000","color":"blue","white_noshoot":false},{"action":"blink","count":"3","color":"white","on":"500","off":"500"}],
	"3 at a time noshoots random":[{"action":"blink","count":"3","color":"randomnowhite","on":"500","off":"500"},{"action":"target","count":"8","reuse":true,"delay":"0","random_delay":"0","concurrent":"3","linked":false,"duration":"3000","light":"3000","g":"100","result_show":"1000","noshoot_percent":"60","noshoot_duration":"2000","color":"lastblink","white_noshoot":false},{"action":"blink","count":"3","color":"white","on":"500","off":"500"}],
	"3 stage 1":[{"action":"blink","count":"3","color":"white","on":"500","off":"500"},{"action":"delay","delay":"500","random_delay":"0"},{"action":"target","count":"8","reuse":true,"delay":"0","random_delay":"0","concurrent":"1","linked":false,"duration":"3000","light":"3000","g":"100","result_show":"1000","noshoot_percent":"0","noshoot_duration":"3000","color":"blue","white_noshoot":false},{"action":"blink","count":"3","color":"white","on":"500","off":"500"},{"action":"delay","delay":"500","random_delay":"0"},{"action":"target","count":"8","reuse":false,"delay":"0","random_delay":"0","concurrent":"2","linked":true,"duration":"3000","light":"3000","g":"100","result_show":"1000","noshoot_percent":"0","noshoot_duration":"3000","color":"blue","white_noshoot":true},{"action":"blink","count":"3","color":"randomnowhite","on":"500","off":"500"},{"action":"delay","delay":"500","random_delay":"0"},{"action":"target","count":"8","reuse":true,"delay":"0","random_delay":"0","concurrent":"3","linked":false,"duration":"3000","light":"3000","g":"100","result_show":"1000","noshoot_percent":"90","noshoot_duration":"800","color":"lastblink","white_noshoot":false},{"action":"blink","count":"3","color":"white","on":"500","off":"500"}]
}

function GetStoredGames() {
	let serialized_games = localStorage.getItem('game_storage')
	let saved_games = {};
	if(serialized_games != null){
		saved_games = JSON.parse(serialized_games);
	}
    return saved_games;
}

function GetAllGames() {
	return Object.assign({}, premade_games, GetStoredGames());
}

function PopulateGameSelect() {
	let all_games = GetAllGames()
	
	let select_game = document.getElementById('load_actions');
	
	//clear select options
	for(let i = select_game.options.length - 1; i >= 0; i--) {
		select_game.remove(i);
	}
	
	//add default
	{{
	   let opt = document.createElement("option");
	   opt.value= '';
	   opt.textContent = '--Load Game--'; 
	   select_game.appendChild(opt);
	}}
	
	//add keys from premade and custom games
	let keys = Object.keys(all_games);
	for(let i=0; i<keys.length; ++i ) {
	   let opt = document.createElement("option");
	   opt.value= keys[i];
	   opt.textContent = keys[i]; 
	   select_game.appendChild(opt);
	}
}

function SaveActions(event){
	let saved_games = GetStoredGames();
	
	//add new actions
	let actions = GetActionArray();
	let game_name = document.getElementById('game_name').value;
	saved_games[game_name] = actions
	
    localStorage.setItem('game_storage', JSON.stringify(saved_games));
    
	PopulateGameSelect();
}

function LoadActions(e){
	function ReplaceActions(actions){
		table = document.getElementById('actions');
		table.innerHTML = "";
		let new_tbody = document.createElement('tbody');
		//populate_with_new_rows(new_tbody);
		for(let i=0; i<actions.length; ++i){
			table.appendChild(CreateAction(actions[i].action,actions[i]));
		}
	}
  
	let selected_key = e.target.selectedOptions[0].value;	
	if(selected_key == ''){
		return;
	}
	ReplaceActions(GetAllGames()[selected_key]);
}

function DeleteSelected(e) {
	let saved_games = GetStoredGames();
	
	let selected_key = document.getElementById('load_actions').selectedOptions[0].value;
	
	if( selected_key in saved_games ) {
		delete saved_games[selected_key]
		localStorage.setItem('game_storage', JSON.stringify(saved_games));
		PopulateGameSelect();
	}
}

function ExportGames(event){
	// Function to download data to a file
	function PromptDownload(data, filename) {
		let file = new Blob([data], {type: "application/json"});
		let a = document.createElement("a"),
				url = URL.createObjectURL(file);
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		setTimeout(function() {
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);  
		}, 0); 
	}
	
	let saved_games = GetStoredGames();

	PromptDownload(JSON.stringify(saved_games),'games' + new Date().toISOString().split('T')[0] + '.json');
}

function ImportGames(e){
  let file = e.target.files[0];
  if (!file) {
    return;
  }
  let reader = new FileReader();
  reader.onload = function(e) {
    let contents = e.target.result;
	let loaded_games = JSON.parse(contents);
	
	let combined_store = Object.assign({}, GetStoredGames(), loaded_games);
	localStorage.setItem('game_storage', JSON.stringify(combined_store));
	PopulateGameSelect();
  };
  reader.readAsText(file);
}

PopulateGameSelect();
document.getElementById('load_actions')
  .addEventListener('change', LoadActions, false);
  
document.getElementById('import_games_hidden')
  .addEventListener('change', ImportGames, false);


