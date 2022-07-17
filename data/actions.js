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
		'count' : {'unit' : 'int', 'label' : 'Count', 'default' : 6},
		'reuse' : {'unit' : 'bool', 'label' : 'Reuse', 'default' : false},
		'delay' : {'unit' : 'millisecond', 'label' : 'Delay (ms)', 'default' : 0},
		'random_delay' : {'unit' : 'millisecond', 'label' : 'Random Delay (ms)', 'default' : 0},
		'concurrent' : {'unit' : 'int', 'label' : 'Concurrent', 'default' : 1},
		'linked' : {'unit' : 'bool', 'label' : 'Link Concurrent', 'default' : true},
		'duration' : {'unit' : 'millisecond', 'label' : 'On Time (ms)', 'default' : 3000},
		'g' : {'unit' : 'int', 'label' : 'G Trigger (tenths)', 'default' : 150},
		'penalty' : {'unit' : 'millisecond', 'label' : 'Miss Penalty (ms)', 'default' : 5000},
		'result_show' : {'unit' : 'millisecond', 'label' : 'Result Show (ms)', 'default' : 1000}
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

function CreateParameters(key,table){
	let parameters = Object.keys(ACTION_PARAMETERS[key]);
	for(let i=0;i<parameters.length;++i){
		let attributes = ACTION_PARAMETERS[key][parameters[i]];
		let input;
		switch(attributes.unit){
			case 'int':
			case 'millisecond':
			case 'char':
				input = CreateNumber(parameters[i], attributes.default);
				break;
			case 'color':
				input = CreateSelect('color',['red','green','blue','white'],attributes.default);
				break;
			case 'bool':
				input = CreateCheckbox(parameters[i], attributes.default);
				break;		
		}
		table.appendChild(CreateRow([CreateLabel(attributes.label),input]))
	}
}

function CreateAction(key){
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
	CreateParameters(key,table)
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


//build object representation of action forms
function RunGame(){
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
