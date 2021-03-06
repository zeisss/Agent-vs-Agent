/*
Is THE autority when it comes to game managements.
All agent interaction is controlled by THE game master.
*/
function GameMaster() {
	 this.gamingField = 0;
	 this.teamAHomeBase = [0,0];
	 this.teamBHomeBase = [7,7];

	 this.teamAAgents = [];
	 this.teamBAgents = [];

	 this.teamAAgentClass = null;
	 this.teamBAgentClass = null;

	 this.actingOrder = [];

	 this.moveCount = 0;

	 this.pointsDistributed = 0;
	 this.teamAScore = 0;
	 this.teamBScore = 0;

	 this.agentsWithPoints = [];

	 this.nextAgentInLine = 0;
}

GameMaster.prototype.setTeamAAgentClass = function(agentClass){
	this.teamAAgentClass = agentClass;
}

GameMaster.prototype.setTeamBAgentClass = function(agentClass){
	this.teamBAgentClass = agentClass;
}

GameMaster.prototype.resetAgents = function (agentsPerTeam){
	this.teamAAgents = [];
	this.teamBAgents = [];
	this.agentsWithPoints = [];

	for (var i = 0; i < agentsPerTeam; i++) {
		var agentA = new this.teamAAgentClass(agentsPerTeam,this.teamAHomeBase, i);
		this.decorateAgent(agentA, "team_a");
		this.teamAAgents.push(agentA);

		var agentB = new this.teamBAgentClass(agentsPerTeam,this.teamBHomeBase, i);
		this.decorateAgent(agentB, "team_b");
		this.teamBAgents.push(agentB);
	}
}

GameMaster.prototype.decorateAgent = function (agent, team) {
	AgentDecorator(agent);
	TeamDecorator(agent, team);
	PointDecorator(agent, false);
}


GameMaster.prototype.resetGamingField = function (){
	this.gamingField = new GamingField();
}

GameMaster.prototype.placeAgents = function (){
	this.gamingField.placeAll(this.teamAAgents, this.teamAHomeBase);
	this.gamingField.placeAll(this.teamBAgents, this.teamBHomeBase);
}

GameMaster.prototype.determinActingOrder = function (){
	this.actingOrder = [];
	if (Math.random() < 0.5) {
		// start with team A
		for (var i = 0; i < this.teamAAgents.length; i++) {
			this.actingOrder.push(this.teamAAgents[i]);
			this.actingOrder.push(this.teamBAgents[i]);
		}

	} else {
		// start with team B
		for (var i = 0; i < this.teamAAgents.length; i++) {
			this.actingOrder.push(this.teamBAgents[i]);
			this.actingOrder.push(this.teamAAgents[i]);
		}
	}
}

GameMaster.prototype.baseIndexTo2dCoords = function (baseIndex) {
	var basesPerLine = 8;
	var y = Math.floor(baseIndex / basesPerLine);
	var x = (baseIndex % basesPerLine);
	return [x,y];
}

GameMaster.prototype.distributePoints = function (numberOfPoints) {
	this.pointsDistributed = 0;
	var numberOfBases = 8*8;

	while(this.pointsDistributed < numberOfPoints){
		var baseIndex = Math.floor(Math.random() * numberOfBases);
		var coords2d = this.baseIndexTo2dCoords(baseIndex);

		// dont't place points on the home bases
		if (!arrayEqual(coords2d, [0,0])
			&& !arrayEqual(coords2d, [7,7])) 
		{
			this.gamingField.place(new Point(), coords2d);
			this.pointsDistributed++;
		};
	}
}

GameMaster.prototype.stepNorth = function (coords){
	var y = coords[1]+1;
	if (y > 7) y = 7;
	return [coords[0], y];
}

GameMaster.prototype.stepEast = function (coords){
	var x = coords[0]+1;
	if (x > 7) x = 7;
	return [x, coords[1]];
}

GameMaster.prototype.stepSouth = function (coords){
	var y = coords[1]-1;
	if (y < 0) y = 0;
	return [coords[0], y];
}

GameMaster.prototype.stepWest = function (coords){
	var x = coords[0]-1;
	if (x < 0) x = 0;
	return [x, coords[1]];
}

GameMaster.prototype.executeMove = function (agent){
	var direction = agent.getMoveDirection().toUpperCase();

	var oldPosition = this.gamingField.remove(agent);
	if (oldPosition === false){
		console.log("Fatal ERROR: agent was not found in GamingField!!!");
		return;
	}

	var newPosition;
	switch (direction){
		case "N":
			newPosition = this.stepNorth(oldPosition);
			break;
		case "NE":
		case "EN":
			newPosition = this.stepEast(this.stepNorth(oldPosition));
			break;
		case "E":
			newPosition = this.stepEast(oldPosition);
			break;
		case "SE":
		case "ES":
			newPosition = this.stepEast(this.stepSouth(oldPosition));
			break;
		case "S":
			newPosition = this.stepSouth(oldPosition);
			break;
		case "SW":
		case "WS":
			newPosition = this.stepWest(this.stepSouth(oldPosition));
			break;
		case "W":
			newPosition = this.stepWest(oldPosition);
			break;
		case "NW":
		case "WN":
			newPosition = this.stepWest(this.stepNorth(oldPosition));
			break;

		default:
			console.log("GameMaster does not understand direction: " + direction + " from agent: " + agent);
			break;
	}

	this.gamingField.place(agent, newPosition);
	agent.newPosition(newPosition);

	if (this.agentHasPoint(agent)
		&& this.agentOnHomeBase(agent)){
		
			this.scorePoint(agent);
			agent.pointScored();
			this.removePointFromAgent(agent);
	}
}

GameMaster.prototype.removePointFromAgent = function (agent){
	var idx = this.agentsWithPoints.indexOf(agent);
	this.agentsWithPoints.splice(idx, 1);
	PointDecorator(agent, false);
}

GameMaster.prototype.scorePoint = function (agent){
	switch (agent.getTeam()){
		case "team_a":
			this.teamAScore += 1;
			break;
		case "team_b":
			this.teamBScore += 1;
			break;
		default:
			console.log("Invalid agent type: " + agent.getType());
			break;
	}
}

GameMaster.prototype.agentHasPoint = function (agent){
	return this.agentsWithPoints.indexOf(agent) >= 0
}

GameMaster.prototype.agentOnHomeBase = function (agent){
	var agentPosition = this.gamingField.getCoordinatesOf(agent)

	switch (agent.getTeam()){
		case "team_a":
			return arrayEqual(agentPosition, this.teamAHomeBase);
		case "team_b":
			return arrayEqual(agentPosition, this.teamBHomeBase);
		default:
			console.log("Invalid agent type: " + agent.getType());
			return;
	}
}

GameMaster.prototype.executeComunicate = function (agent){
	var msg = String(agent.getMessage());
	switch (agent.getTeam()){
		case "team_a":
			this.teamAAgents.foreach(function (i, v){
				v.receiveMessage(msg);
			});
			break;
		case "team_b":
			this.teamBAgents.foreach(function (i, v){
				v.receiveMessage(msg);
			});
			break;
		default:
			console.log("Unknown team: " + agent.getTeam());
	}
}

GameMaster.prototype.executeCollect = function (agent){
	if (this.agentsWithPoints.indexOf(agent) >= 0){
		// this agent allready has a point collected
		agent.pointNotCollected();
		return;
	}

	var coordinates = this.gamingField.getCoordinatesOf(agent);
	var enities = this.gamingField.getAll(coordinates);
	for (var i = 0 ; i < enities.length; i++) {
		var entity = enities[i];
		if (entity.getType() == "Point"){
			this.gamingField.remove(entity);
			agent.pointCollected();
			PointDecorator(agent, true);
			this.agentsWithPoints.push(agent);
		}
	}
}

GameMaster.prototype.processChoice = function (agent, choice) {
	switch (choice) {
		case "move":
			this.executeMove(agent);
			break;
		case "comunicate":
			this.executeComunicate(agent);
			break;
		case "collect":
			this.executeCollect(agent);
			break;
		case "skip":
			break;
		default:
			console.log("GameMaster does not understand choice: " + choice + " of agent: " + agent);
	}
}

GameMaster.prototype.explainSurroundingsTo = function (activeAgent){
	var agentPosition = this.gamingField.getCoordinatesOf(activeAgent);
	var surrounding = this.gamingField.getSurroundingFor(agentPosition);
	// remove the agent from the surrounding
	var center = surrounding.C;
	if (center.length === 1){
		delete surrounding.C;
	} else {
		var idx = (surrounding.C).indexOf(activeAgent.getType());
		(surrounding.C).splice(idx, 1);
	}
	
	activeAgent.newSurrounding(surrounding);
}

GameMaster.prototype.getAgentId = function (agent){
	return this.actingOrder.indexOf(agent);
}

/**
 * Returns false if the game is over
 */
GameMaster.prototype.nextMove = function (){
	//console.log("this.teamAScore: " + this.teamAScore);
	//console.log("this.teamBScore: " + this.teamBScore);
	//console.log("this.pointsDistributed: " + this.pointsDistributed);

	if ((this.teamAScore + this.teamBScore) < this.pointsDistributed){
		// there are still uncollected points
		//console.log("GameMaster.nextMove() : next agent in line: " + this.nextAgentInLine);
		var activeAgent = this.actingOrder[this.nextAgentInLine];
		this.explainSurroundingsTo(activeAgent);
		var choice = activeAgent.chooseAction();
		this.processChoice(activeAgent, choice);
		this.nextAgentInLine++;
		this.nextAgentInLine %= this.actingOrder.length;
		return true;
	} else {
		// all points are collected
		console.log("GameMaster: all points are collected. No next move.");
		return false; // no next move!
	}
}

GameMaster.prototype.newGame = function (){
	this.resetGamingField();
	this.resetAgents(2);
	this.placeAgents();
	this.distributePoints(10);
	this.determinActingOrder();
}


function AgentDecorator(agent) {

	agent.getType = function (){
		return "Agent";
	}

}

function TeamDecorator(agent, team) {

	agent.getTeam = function (){
		return String(team).toLowerCase();
	}

}

function PointDecorator(agent, hasPoint) {

	agent.hasPoint = function (){
		return hasPoint;
	}

}

