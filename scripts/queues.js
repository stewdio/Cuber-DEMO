/*


	QUEUES

	Queues are glorified Arrays and rather useful for things like our
	cube.twistQueue, cube.taskQueue, etc. 


*/








function Queue( validation ){


	//  Do we want to run a validation routine on objects being stored in 
	//  this Queue? If so you can send the function as an argument to the 
	//  constructor or create this property later on your own.

	if( validation !== undefined && validation instanceof Function ) this.validate = validation


	//  The rest is vanilla.

	this.history = []
	this.future  = []
	this.isReady = true
	this.isLooping = false
}




//  The idea here with .add() is that .validate() will always return an Array.
//  The reason for this is that the validator may decide it needs to add more
//  than one element to the Queue. This allows it to do so.

Queue.prototype.add = function(){

	var 
	elements = Array.prototype.slice.call( arguments ),
	_this = this

	if( this.validate !== undefined && this.validate instanceof Function ) elements = this.validate( elements )

	if( elements instanceof Array ){
	
		elements.forEach( function( element ){

			_this.future.push( element )
		})
	}
}
Queue.prototype.empty = function(){

	this.future = []
}
Queue.prototype.do = function(){

	if( this.future.length ){

		var element = this.future.shift()
		this.history.push( element )
		return element
	}
	else if( this.isLooping ){

		this.future  = this.history.slice()
		this.history = []
	}
}
Queue.prototype.undo = function(){

	if( this.history.length ){
		
		var element = this.history.pop()
		this.future.unshift( element )
		return element
	}
}
Queue.prototype.redo = function(){

	this.do()
}



