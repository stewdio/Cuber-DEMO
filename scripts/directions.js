/*


	DIRECTIONS

	We have six Directions which we map in a spiral around a cube: front, up,
	right, down, left, and back. That's nice on its own but what's important 
	is the relationships between faces. For example, What's to the left of the
	Front face? Well that depends on what the Front faace considers "up" to 
	be. The Direction class handles these relationships and calculates clock-
	wise and anticlockwise relationships.


	                 ------------- 
	                |             |
	                |      0      |   opposite
	                |             |
	                |    getUp()  |
	                |             |
	   ------------- ------------- ------------- 
	  |             |             |             |
	  |      3      |             |      1      |
	  |             |             |             |
	  |  getLeft()  |    this     |  getRight() |
	  |             |             |             |
	   ------------- ------------- ------------- 
	                |             |
	                |      2      |
	                |             |
	                |  getDown()  |
	                |             |
	                 ------------- 


	The following equalities demonstrate how Directions operate:

	  FRONT.getOpposite() === BACK
	  FRONT.getUp() === UP
	  FRONT.getUp( LEFT ) === LEFT
	  FRONT.getRight() === RIGHT
	  FRONT.getRight( DOWN ) === LEFT
	  FRONT.getClockwise() === RIGHT
	  FRONT.getClockwise( RIGHT ) === DOWN

	  RIGHT.getOpposite() === LEFT
	  RIGHT.getUp() === UP
	  RIGHT.getUp( FRONT ) === FRONT
	  RIGHT.getRight() === BACK
	  RIGHT.getRight( DOWN ) === FRONT
	  RIGHT.getClockwise() === BACK
	  RIGHT.getClockwise( FRONT ) === UP


	Keep in mind that a direction cannot use itself or its opposite as the
	normalized up vector when seeking a direction!

	  RIGHT.getUp( RIGHT ) === null
	  RIGHT.getUp( LEFT  ) === null


*/








function Direction( id, name ){

	this.id        = id
	this.name      = name.toLowerCase()
	this.initial   = name.substr( 0, 1 ).toUpperCase()
	this.neighbors = []
	this.opposite  = null
}
Direction.prototype.setRelationships = function( up, right, down, left, opposite ){

	this.neighbors = [ up, right, down, left ]
	this.opposite  = opposite
}




Direction.getNameById = function( id ){

	return [

		'front',
		'up',
		'right',
		'down',
		'left',
		'back'

	][ id ]
}
Direction.getIdByName = function( name ){

	return {

		front: 0,
		up   : 1,
		right: 2,
		down : 3,
		left : 4,
		back : 5

	}[ name ]
}
Direction.getDirectionById = function( id ){

	return [

		FRONT,
		UP,
		RIGHT,
		DOWN,
		LEFT,
		BACK

	][ id ]
}
Direction.getDirectionByInitial = function( initial ){

	return {

		F: FRONT,
		U: UP,
		R: RIGHT,
		D: DOWN,
		L: LEFT,
		B: BACK

	}[ initial.toUpperCase() ]
}
Direction.getDirectionByName = function( name ){

	return {

		front: FRONT,
		up   : UP,
		right: RIGHT,
		down : DOWN,
		left : LEFT,
		back : BACK

	}[ name.toLowerCase() ]
}




//  If we're looking at a particular face 
//  and we designate an adjacet side as up
//  then we can calculate what adjacent side would appear to be up
//  if we rotated clockwise or anticlockwise.

Direction.prototype.getRotation = function( vector, from, steps ){

	if( from === undefined ) from = this.neighbors[ 0 ]
	if( from === this || from === this.opposite ) return null
	steps = steps === undefined ? 1 : steps.modulo( 4 )
	for( var i = 0; i < 5; i ++ ){

		if( this.neighbors[ i ] === from ) break
	}
	return this.neighbors[ i.add( steps * vector ).modulo( 4 )]
}
Direction.prototype.getClockwise = function( from, steps ){

	return this.getRotation( +1, from, steps )
}
Direction.prototype.getAnticlockwise = function( from, steps ){

	return this.getRotation( -1, from, steps )
}


//  Similar to above,
//  if we're looking at a particular face 
//  and we designate an adjacet side as up
//  we can state what sides appear to be to the up, right, down, and left
//  of this face.

Direction.prototype.getDirection = function( direction, up ){

	return this.getRotation( 1, up, direction.id - 1 )
}
Direction.prototype.getUp = function( up ){

	return this.getDirection( UP, up )
}
Direction.prototype.getRight = function( up ){

	return this.getDirection( RIGHT, up )
}
Direction.prototype.getDown = function( up ){

	return this.getDirection( DOWN, up )
}
Direction.prototype.getLeft = function( up ){

	return this.getDirection( LEFT, up )
}



//  An convenience method that mimics the verbiage
//  of the getRotation() and getDirection() methods.

Direction.prototype.getOpposite = function(){

	return this.opposite
}




//  Create facing directions as global constants this way we can access from 
//  anywhere in any scope without big long variables names full of dots and 
//  stuff. Sure, ES5 doesn't really have constants but the all-caps alerts you
//	to the fact that them thar variables ought not to be messed with.

var 
FRONT = new Direction( 0, 'front' ),
UP    = new Direction( 1, 'up'    ),
RIGHT = new Direction( 2, 'right' ),
DOWN  = new Direction( 3, 'down'  ),
LEFT  = new Direction( 4, 'left'  ),
BACK  = new Direction( 5, 'back'  )


//  Now that they all exist we can 
//  establish their relationships to one another.

FRONT.setRelationships( UP,    RIGHT, DOWN,  LEFT,  BACK  )
UP.setRelationships(    BACK,  RIGHT, FRONT, LEFT,  DOWN  )
RIGHT.setRelationships( UP,    BACK,  DOWN,  FRONT, LEFT  )
DOWN.setRelationships(  FRONT, RIGHT, BACK,  LEFT,  UP    )
LEFT.setRelationships(  UP,    FRONT, DOWN,  BACK,  RIGHT )
BACK.setRelationships(  UP,    LEFT,  DOWN,  RIGHT, FRONT )



