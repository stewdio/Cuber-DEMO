/*


	CUBES

	A Cube is composed of 27 Cubelets (3x3x3 grid) numbered 0 through 26.
	Cubelets are numbered beginning from the top-left-forward corner of the 
	Cube and proceeding left to right, top to bottom, forward to back:
     

             ----------------------- 
           /   18      19      20  /|
          /                       / |
         /   9      10       11  / 20
        /                       /   |
       /   0       1       2   / 11 |
       -----------------------     23
      |                       |2    |
      |   0       1       2   |  14 |
      |                       |    26
      |                       |5    |
      |   3       4       5   |  17 /
      |                       |    /
      |                       |8  /
      |   6       7       8   |  /
      |                       | /
       ----------------------- 



	Portions of the Cube are grouped (Groups):

	  this.core
	  this.centers
	  this.edges
	  this.corners
	  this.crosses
	


	Portions of the Cube are grouped and rotatable (Slices):

	Rotatable around the Z axis:
	  this.front
	  this.standing
	  this.back

	Rotatable around the X axis:
	  this.left
	  this.middle
	  this.right

	Rotatable around the Y axis:
	  this.up
	  this.equator
	  this.down



	A Cube may be inspected through its Faces (see Slices for more 
	information on Faces vs Slices). From the browser's JavaScript console:

	  this.inspect()

	This will reveal each Face's Cubelet indexes and colors using the Face's
	compact inspection mode. The non-compact mode may be accessed by passing
	a non-false value as an argument:

	  this.inspect( true )




*/








function Cube( preset ){


	//  Important for working around lexical closures in things like
	//  forEach() or setTimeout(), etc which change the scope of "this".

	var cube = this


	//  Some important booleans.

	this.isReady     = true
	this.isShuffling = false
	this.isRotating  = false
	this.isSolving   = false


	//  Every fire of this.loop() will attempt to complete our tasks
	//  which can only be run if this.isReady === true.

	this.taskQueue = new Queue()


	//  We need the ability to gang up twist commands.
	//  Every fire of this.loop() will attempt to empty it.

	this.twistQueue = new Queue( Twist.validate )


	//  How long should a Cube.twist() take?

	this.twistDuration = SECOND


	//  If we shuffle, how shall we do it?
	
	this.shuffleMethod = this.PRESERVE_LOGO


	//  Size matters? Cubelets will attempt to read these values.

	this.size = 420
	this.cubeletSize = 140




	//  We need to create and setup a new CSS3 Object
	//  to represent our Cube. 
	//  THREE will take care of attaching it to the DOM, etc.

	if( erno.renderMode === 'css' ){
	
		this.domElement = document.createElement( 'div' )
		this.domElement.classList.add( 'cube' )
		this.threeObject = new THREE.CSS3DObject( this.domElement )
	}
	else if( erno.renderMode === 'svg' ){

		this.threeObject = new THREE.Object3D()
	}
	this.threeObject.rotation.set(

		(  25 ).degreesToRadians(), 
		( -30 ).degreesToRadians(),
		0
	)
	scene.add( this.threeObject )


	//  If we enable Auto-Rotate then the cube will spin (not twist!) in space
	//  by adding the following values to the Three object on each frame.

	this.rotationDeltaX = 0.1
	this.rotationDeltaY = 0.15
	this.rotationDeltaZ = 0




	//  Here's the first big map we've come across in the program so far. 
	//  Imagine you're looking at the Cube straight on so you only see the front face.
	//  We're going to map that front face from left to right (3), and top to bottom (3): 
	//  that's 3 x 3 = 9 Cubelets.
	//  But then behind the Front slice we also have a Standing slice (9) and Back slice (9),
	//  so that's going to be 27 Cubelets in total to create a Cube.

	this.cubelets = []
	;([

		//  Front slice

		[ W, O,  ,  , G,   ],    [ W, O,  ,  ,  ,   ],    [ W, O, B,  ,  ,   ],//   0,  1,  2
		[ W,  ,  ,  , G,   ],    [ W,  ,  ,  ,  ,   ],    [ W,  , B,  ,  ,   ],//   3,  4,  5
		[ W,  ,  , R, G,   ],    [ W,  ,  , R,  ,   ],    [ W,  , B, R,  ,   ],//   6,  7,  8


		//  Standing slice

		[  , O,  ,  , G,   ],    [  , O,  ,  ,  ,   ],    [  , O, B,  ,  ,   ],//   9, 10, 11
		[  ,  ,  ,  , G,   ],    [  ,  ,  ,  ,  ,   ],    [  ,  , B,  ,  ,   ],//  12, XX, 14
		[  ,  ,  , R, G,   ],    [  ,  ,  , R,  ,   ],    [  ,  , B, R,  ,   ],//  15, 16, 17


		//  Back slice

		[  , O,  ,  , G, Y ],    [  , O,  ,  ,  , Y ],    [  , O, B,  ,  , Y ],//  18, 19, 20
		[  ,  ,  ,  , G, Y ],    [  ,  ,  ,  ,  , Y ],    [  ,  , B,  ,  , Y ],//  21, 22, 23
		[  ,  ,  , R, G, Y ],    [  ,  ,  , R,  , Y ],    [  ,  , B, R,  , Y ] //  24, 25, 26

	]).forEach( function( cubeletColorMap, cubeletId ){

		cube.cubelets.push( new Cubelet( cube, cubeletId, cubeletColorMap ))
	})


	//  Mapping the Cube creates all the convenience shortcuts
	//  that we will need later. (Demonstrated immediately below!)

	this.map()


	//  Now that we have mapped faces we can create faceLabels

	if( erno.renderMode === 'css' ){

		this.faces.forEach( function( face, i ){

			var labelElement = document.createElement( 'div' )
			labelElement.classList.add( 'faceLabel' )
			labelElement.classList.add( 'face'+ face.face.capitalize() )
			labelElement.innerHTML = face.face.toUpperCase()
			cube.domElement.appendChild( labelElement )
		})
	}


	//  We need to map our folds separately from Cube.map()
	//  because we only want folds mapped at creation time.
	//  Remapping folds with each Cube.twist() would get weird...

	this.folds = [

		new Fold( this.front, this.right ),
		new Fold( this.left,  this.up    ),
		new Fold( this.down,  this.back  )
	]


	//  Enable some "Hero" text for this Cube.
	
	if( erno.renderMode === 'css' ){

		this.setText( 'BEYONDRUBIKs  CUBE', 0 )
		this.setText( 'BEYONDRUBIKs  CUBE', 1 )
		this.setText( 'BEYONDRUBIKs  CUBE', 2 )
	}


	//  Shall we load some presets here?

	preset = 'preset' + preset.capitalize()
	if( this[ preset ] instanceof Function === false ) preset = 'presetBling'
	this[ preset ]()


	//  Get ready for major loop-age.
	//  Our Cube checks these booleans at roughly 60fps.

	setInterval( cube.loop, 16 )


	//  Enable key commands for our Cube.

	$( document ).keypress( function( event ){

		if( $( 'input:focus, textarea:focus' ).length === 0 ){
			
			var key = String.fromCharCode( event.which )
			if( 'XxRrMmLlYyUuEeDdZzFfSsBb'.indexOf( key ) >= 0 ) cube.twistQueue.add( key )
		}
	})
}








setupTasks = window.setupTasks || []
setupTasks.push( function(){

	Cube.prototype = Object.create( Group.prototype )
	Cube.prototype.constructor = Cube

	forceAugment( Cube, {


		//  A Rubik's Cube is composed of 27 cubelets arranged 3 x 3 x 3.
		//  We need a map that relates these 27 locations to the 27 cubelets
		//  such that we can ask questions like:
		//  What colors are on the Front face of the cube? Etc.

		map: function(){
				
			var that = this, i


			//  Groups are simple collections of Cubelets.
			//  Their position and rotation is irrelevant. 

			this.core    = new Group()
			this.centers = new Group()
			this.edges   = new Group()
			this.corners = new Group()
			this.crosses = new Group()
			this.cubelets.forEach( function( cubelet, index ){

				if( cubelet.type === 'core'   ) that.core.add( cubelet )
				if( cubelet.type === 'center' ) that.centers.add( cubelet )
				if( cubelet.type === 'edge'   ) that.edges.add( cubelet )
				if( cubelet.type === 'corner' ) that.corners.add( cubelet )
				if( cubelet.type === 'center' || cubelet.type === 'edge' ) that.crosses.add( cubelet )
			})


			//  Slices that can rotate about the X-axis:

			this.left = new Slice(

				this.cubelets[ 24 ], this.cubelets[ 21 ], this.cubelets[ 18 ],
				this.cubelets[ 15 ], this.cubelets[ 12 ], this.cubelets[  9 ],
				this.cubelets[  6 ], this.cubelets[  3 ], this.cubelets[  0 ]
			)
			this.left.name = 'left'
			this.middle = new Slice(

				this.cubelets[ 25 ], this.cubelets[ 22 ], this.cubelets[ 19 ],
				this.cubelets[ 16 ], this.cubelets[ 13 ], this.cubelets[ 10 ],
				this.cubelets[  7 ], this.cubelets[  4 ], this.cubelets[  1 ]
			)
			this.middle.name = 'middle'
			this.right = new Slice(

				this.cubelets[  2 ], this.cubelets[ 11 ], this.cubelets[ 20 ],
				this.cubelets[  5 ], this.cubelets[ 14 ], this.cubelets[ 23 ],
				this.cubelets[  8 ], this.cubelets[ 17 ], this.cubelets[ 26 ]
			)
			this.right.name = 'right'


			//  Slices that can rotate about the Y-axis:

			this.up = new Slice(

				this.cubelets[ 18 ], this.cubelets[ 19 ], this.cubelets[ 20 ],
				this.cubelets[  9 ], this.cubelets[ 10 ], this.cubelets[ 11 ],
				this.cubelets[  0 ], this.cubelets[  1 ], this.cubelets[  2 ]
			)
			this.up.name = 'up'
			this.equator = new Slice(

				this.cubelets[ 21 ], this.cubelets[ 22 ], this.cubelets[ 23 ],
				this.cubelets[ 12 ], this.cubelets[ 13 ], this.cubelets[ 14 ],
				this.cubelets[  3 ], this.cubelets[  4 ], this.cubelets[  5 ]
			)
			this.equator.name = 'equator'
			this.down = new Slice(

				this.cubelets[  8 ], this.cubelets[ 17 ], this.cubelets[ 26 ],
				this.cubelets[  7 ], this.cubelets[ 16 ], this.cubelets[ 25 ],
				this.cubelets[  6 ], this.cubelets[ 15 ], this.cubelets[ 24 ]
			)
			this.down.name = 'down'


			//  Slices are Groups with purpose; they are rotate-able!
			//  These are Slices that can rotate about the Z-axis:

			this.front = new Slice(

				this.cubelets[  0 ], this.cubelets[  1 ], this.cubelets[  2 ],
				this.cubelets[  3 ], this.cubelets[  4 ], this.cubelets[  5 ],
				this.cubelets[  6 ], this.cubelets[  7 ], this.cubelets[  8 ]
			)
			this.front.name = 'front'
			this.standing = new Slice(

				this.cubelets[  9 ], this.cubelets[ 10 ], this.cubelets[ 11 ],
				this.cubelets[ 12 ], this.cubelets[ 13 ], this.cubelets[ 14 ],
				this.cubelets[ 15 ], this.cubelets[ 16 ], this.cubelets[ 17 ]
			)
			this.standing.name = 'standing'
			this.back = new Slice(

				this.cubelets[ 26 ], this.cubelets[ 23 ], this.cubelets[ 20 ],
				this.cubelets[ 25 ], this.cubelets[ 22 ], this.cubelets[ 19 ],
				this.cubelets[ 24 ], this.cubelets[ 21 ], this.cubelets[ 18 ]
			)
			this.back.name = 'back'


			//  Faces .... special kind of Slice!

			this.faces = [ this.front, this.up, this.right, this.down, this.left, this.back ]


			//  Good to let each Cubelet know where it exists
			//  in relationship to our full Cube.

			for( i = 0; i < this.cubelets.length; i ++ ){

				this.cubelets[ i ].setAddress( i )
			}
		},




		//  We can read and write text to the Cube.
		//  This is handled by Folds which are composed of two Faces.

		getText: function( fold ){

			if( fold === undefined ){

				return [

					this.folds[ 0 ].getText(),
					this.folds[ 1 ].getText(),
					this.folds[ 2 ].getText()
				]
			}
			else if( isNumeric( fold ) && fold >= 0 && fold <= 2 ){

				return this.folds[ fold ].getText()
			}
		},
		setText: function( text, fold ){

			if( fold === undefined ){

				this.folds[ 0 ].setText( text )
				this.folds[ 1 ].setText( text )
				this.folds[ 2 ].setText( text )
			}
			else if( isNumeric( fold ) && fold >= 0 && fold <= 2 ){

				this.folds[ fold ].setText( text )
			}
		},




		//  We'll inspect the Cube by specifically inspecting the Faces.
		//  Bear in mind this is merely one way to think about the Cube
		//  and does require some redundancy in terms of Cubelet indexes.
		//  Here we'll default to 'compact' mode in order to give the
		//  full Cube overview in the least amount of space. 

		inspect: function( compact, side ){

			compact = !compact

			this.front.inspect( compact, side )
			this.up.inspect(    compact, side )
			this.right.inspect( compact, side )
			this.down.inspect(  compact, side )
			this.left.inspect(  compact, side )
			this.back.inspect(  compact, side )
		},




		solve: function(){

			this.isSolving = true
		},
		isSolved: function(){

			return (

				this.front.isSolved( FRONT ) &&
				this.up.isSolved(    UP    ) &&
				this.right.isSolved( RIGHT ) &&
				this.down.isSolved(  DOWN  ) &&
				this.left.isSolved(  LEFT  ) &&
				this.back.isSolved(  BACK  )
			)
		},




		twist: function( twist ){

			var onTwistComplete
			
			if( twist instanceof Twist && !cube.isTweening() ){

				command = twist.command
				degrees = twist.degrees
				if( erno.verbosity >= 0.8 ){
	
					console.log( 

						'Executing a twist command to rotate the '+ 
						 twist.group +' '+ twist.wise +' by',
						 twist.degrees, 'degrees.'
					)
				}


				//  X-axis rotations
		
				if( command === 'X' && !cube.isEngagedY() && !cube.isEngagedZ() ){

					onTwistComplete = function( swap ){

						cube.cubelets = [

							swap[  6 ], swap[  7 ], swap[  8 ],
							swap[ 15 ], swap[ 16 ], swap[ 17 ],
							swap[ 24 ], swap[ 25 ], swap[ 26 ],

							swap[  3 ], swap[  4 ], swap[  5 ],
							swap[ 12 ], swap[ 13 ], swap[ 14 ],
							swap[ 21 ], swap[ 22 ], swap[ 23 ],

							swap[  0 ], swap[  1 ], swap[  2 ],
							swap[  9 ], swap[ 10 ], swap[ 11 ],
							swap[ 18 ], swap[ 19 ], swap[ 20 ]
						]
					}
					if( degrees === undefined ) degrees = cube.getDistanceToPeg( 'X' )
					cube.cubelets.forEach( function( cubelet, i ){

						if( i === cube.cubelets.length - 1 ) cubelet.rotate( 'X', degrees, onTwistComplete )
						else cubelet.rotate( 'X', degrees )
					})
				}
				else if( command === 'x' && !cube.isEngagedY() && !cube.isEngagedZ() ){

					onTwistComplete = function( swap ){

						cube.cubelets = [

							swap[ 18 ], swap[ 19 ], swap[ 20 ],
							swap[  9 ], swap[ 10 ], swap[ 11 ],
							swap[  0 ], swap[  1 ], swap[  2 ],

							swap[ 21 ], swap[ 22 ], swap[ 23 ],
							swap[ 12 ], swap[ 13 ], swap[ 14 ],
							swap[  3 ], swap[  4 ], swap[  5 ],

							swap[ 24 ], swap[ 25 ], swap[ 26 ],
							swap[ 15 ], swap[ 16 ], swap[ 17 ],
							swap[  6 ], swap[  7 ], swap[  8 ]
						]
					}
					if( degrees === undefined ) degrees = cube.getDistanceToPeg( 'x' )
					cube.cubelets.forEach( function( cubelet, i ){

						if( i === cube.cubelets.length - 1 ) cubelet.rotate( 'x', degrees, onTwistComplete )
						else cubelet.rotate( 'x', degrees )
					})
				}
				else if( command === 'R' && !cube.right.isEngagedY() && !cube.right.isEngagedZ() ){

					onTwistComplete = function( swap ){

						cube.cubelets[  2 ] = swap[  8 ]
						cube.cubelets[ 11 ] = swap[  5 ]
						cube.cubelets[ 20 ] = swap[  2 ]
						cube.cubelets[  5 ] = swap[ 17 ]
						cube.cubelets[ 23 ] = swap[ 11 ]
						cube.cubelets[  8 ] = swap[ 26 ]
						cube.cubelets[ 17 ] = swap[ 23 ]
						cube.cubelets[ 26 ] = swap[ 20 ]
					}
					if( degrees === undefined ) degrees = cube.right.getDistanceToPeg( 'X' )
					cube.right.cubelets.forEach( function( cubelet, i ){

						if( i === cube.right.cubelets.length - 1 ) cubelet.rotate( 'X', degrees, onTwistComplete )
						else cubelet.rotate( 'X', degrees )
					})
				}
				else if( command === 'r' && !cube.right.isEngagedY() && !cube.right.isEngagedZ() ){

					onTwistComplete = function( swap ){

						cube.cubelets[  2 ] = swap[ 20 ]
						cube.cubelets[ 11 ] = swap[ 23 ]
						cube.cubelets[ 20 ] = swap[ 26 ]
						cube.cubelets[  5 ] = swap[ 11 ]
						cube.cubelets[ 23 ] = swap[ 17 ]
						cube.cubelets[  8 ] = swap[  2 ]
						cube.cubelets[ 17 ] = swap[  5 ]
						cube.cubelets[ 26 ] = swap[  8 ]
					}
					if( degrees === undefined ) degrees = cube.right.getDistanceToPeg( 'x' )
					cube.right.cubelets.forEach( function( cubelet, i ){

						if( i === cube.right.cubelets.length - 1 ) cubelet.rotate( 'x', degrees, onTwistComplete )
						else cubelet.rotate( 'x', degrees )
					})
				}
				else if( command === 'M' && !cube.middle.isEngagedY() && !cube.middle.isEngagedZ() ){

					onTwistComplete = function( swap ){

						cube.cubelets[  1 ] = swap[ 19 ]
						cube.cubelets[ 10 ] = swap[ 22 ]
						cube.cubelets[ 19 ] = swap[ 25 ]
						cube.cubelets[  4 ] = swap[ 10 ]
						cube.cubelets[ 22 ] = swap[ 16 ]
						cube.cubelets[  7 ] = swap[  1 ]
						cube.cubelets[ 16 ] = swap[  4 ]
						cube.cubelets[ 25 ] = swap[  7 ]
					}
					if( degrees === undefined ) degrees = cube.middle.getDistanceToPeg( 'x' )
					cube.middle.cubelets.forEach( function( cubelet, i ){

						if( i === cube.middle.cubelets.length - 1 ) cubelet.rotate( 'x', degrees, onTwistComplete )
						else cubelet.rotate( 'x', degrees )
					})
				}
				else if( command === 'm' && !cube.middle.isEngagedY() && !cube.middle.isEngagedZ() ){

					onTwistComplete = function( swap ){

						cube.cubelets[  1 ] = swap[  7 ]
						cube.cubelets[ 10 ] = swap[  4 ]
						cube.cubelets[ 19 ] = swap[  1 ]
						cube.cubelets[  4 ] = swap[ 16 ]
						cube.cubelets[ 22 ] = swap[ 10 ]
						cube.cubelets[  7 ] = swap[ 25 ]
						cube.cubelets[ 16 ] = swap[ 22 ]
						cube.cubelets[ 25 ] = swap[ 19 ]
					}
					if( degrees === undefined ) degrees = cube.middle.getDistanceToPeg( 'X' )
					cube.middle.cubelets.forEach( function( cubelet, i ){

						if( i === cube.middle.cubelets.length - 1 ) cubelet.rotate( 'X', degrees, onTwistComplete )
						else cubelet.rotate( 'X', degrees, onTwistComplete )
					})
				}
				else if( command === 'L' && !cube.left.isEngagedY() && !cube.left.isEngagedZ() ){

					onTwistComplete = function( swap ){

						cube.cubelets[ 18 ] = swap[ 24 ]
						cube.cubelets[  9 ] = swap[ 21 ]
						cube.cubelets[  0 ] = swap[ 18 ]
						cube.cubelets[ 21 ] = swap[ 15 ]
						cube.cubelets[  3 ] = swap[  9 ]
						cube.cubelets[ 24 ] = swap[  6 ]
						cube.cubelets[ 15 ] = swap[  3 ]
						cube.cubelets[  6 ] = swap[  0 ]
					}
					if( degrees === undefined ) degrees = cube.left.getDistanceToPeg( 'x' )
					cube.left.cubelets.forEach( function( cubelet, i ){

						if( i === cube.left.cubelets.length - 1 ) cubelet.rotate( 'x', degrees, onTwistComplete )
						else cubelet.rotate( 'x', degrees )
					})
				}
				else if( command === 'l' && !cube.left.isEngagedY() && !cube.left.isEngagedZ() ){

					onTwistComplete = function( swap ){

						cube.cubelets[ 18 ] = swap[  0 ]
						cube.cubelets[  9 ] = swap[  3 ]
						cube.cubelets[  0 ] = swap[  6 ]
						cube.cubelets[ 21 ] = swap[  9 ]
						cube.cubelets[  3 ] = swap[ 15 ]
						cube.cubelets[ 24 ] = swap[ 18 ]
						cube.cubelets[ 15 ] = swap[ 21 ]
						cube.cubelets[  6 ] = swap[ 24 ]
					}
					if( degrees === undefined ) degrees = cube.left.getDistanceToPeg( 'X' )
					cube.left.cubelets.forEach( function( cubelet, i ){

						if( i === cube.left.cubelets.length - 1 ) cubelet.rotate( 'X', degrees, onTwistComplete )
						else cubelet.rotate( 'X', degrees )
					})
				}
				

				//  Y-axis rotations
		
				if( command === 'Y' && !cube.isEngagedX() && !cube.isEngagedZ() ){
			
					onTwistComplete = function( swap ){

						cube.cubelets = [

							swap[  2 ], swap[ 11 ], swap[ 20 ],
							swap[  5 ], swap[ 14 ], swap[ 23 ],
							swap[  8 ], swap[ 17 ], swap[ 26 ],

							swap[  1 ], swap[ 10 ], swap[ 19 ],
							swap[  4 ], swap[ 13 ], swap[ 22 ],
							swap[  7 ], swap[ 16 ], swap[ 25 ],

							swap[  0 ], swap[  9 ], swap[ 18 ],
							swap[  3 ], swap[ 12 ], swap[ 21 ],
							swap[  6 ], swap[ 15 ], swap[ 24 ]
						]
					}
					if( degrees === undefined ) degrees = cube.getDistanceToPeg( 'Y' )
					cube.cubelets.forEach( function( cubelet, i ){

						if( i === cube.cubelets.length - 1 ) cubelet.rotate( 'Y', degrees, onTwistComplete )
						else cubelet.rotate( 'Y', degrees )
					})
				}
				else if( command === 'y' && !cube.isEngagedX() && !cube.isEngagedZ() ){

					onTwistComplete = function( swap ){

						cube.cubelets = [

							swap[ 18 ], swap[  9 ], swap[  0 ],
							swap[ 21 ], swap[ 12 ], swap[  3 ],
							swap[ 24 ], swap[ 15 ], swap[  6 ],

							swap[ 19 ], swap[ 10 ], swap[  1 ],
							swap[ 22 ], swap[ 13 ], swap[  4 ],
							swap[ 25 ], swap[ 16 ], swap[  7 ],

							swap[ 20 ], swap[ 11 ], swap[  2 ],
							swap[ 23 ], swap[ 14 ], swap[  5 ],
							swap[ 26 ], swap[ 17 ], swap[  8 ]
						]
					}
					if( degrees === undefined ) degrees = cube.getDistanceToPeg( 'y' )
					cube.cubelets.forEach( function( cubelet, i ){

						if( i === cube.cubelets.length - 1 ) cubelet.rotate( 'y', degrees, onTwistComplete )
						else cubelet.rotate( 'y', degrees )
					})
				}
				else if( command === 'U' && !cube.up.isEngagedX() && !cube.up.isEngagedZ() ){
					
					onTwistComplete = function( swap ){

						cube.cubelets[ 18 ] = swap[  0 ]
						cube.cubelets[ 19 ] = swap[  9 ]
						cube.cubelets[ 20 ] = swap[ 18 ]
						cube.cubelets[  9 ] = swap[  1 ]
						cube.cubelets[ 11 ] = swap[ 19 ]
						cube.cubelets[  0 ] = swap[  2 ]
						cube.cubelets[  1 ] = swap[ 11 ]
						cube.cubelets[  2 ] = swap[ 20 ]
					}					
					if( degrees === undefined ) degrees = cube.up.getDistanceToPeg( 'Y' )
					cube.up.cubelets.forEach( function( cubelet, i ){
						
						if( i === cube.up.cubelets.length - 1 ) cubelet.rotate( 'Y', degrees, onTwistComplete )
						else cubelet.rotate( 'Y', degrees )
					})
				}
				else if( command === 'u' && !cube.up.isEngagedX() & !cube.up.isEngagedZ() ){
				
					onTwistComplete = function( swap ){

						cube.cubelets[ 18 ] = swap[ 20 ]
						cube.cubelets[ 19 ] = swap[ 11 ]
						cube.cubelets[ 20 ] = swap[  2 ]
						cube.cubelets[  9 ] = swap[ 19 ]
						cube.cubelets[ 11 ] = swap[  1 ]
						cube.cubelets[  0 ] = swap[ 18 ]
						cube.cubelets[  1 ] = swap[  9 ]
						cube.cubelets[  2 ] = swap[  0 ]
					}
					if( degrees === undefined ) degrees = cube.up.getDistanceToPeg( 'y' )
					cube.up.cubelets.forEach( function( cubelet, i ){
						
						if( i === cube.up.cubelets.length - 1 ) cubelet.rotate( 'y', degrees, onTwistComplete )
						else cubelet.rotate( 'y', degrees )
					})
				}
				else if( command === 'E' && !cube.equator.isEngagedX() && !cube.equator.isEngagedZ() ){
					
					onTwistComplete = function( swap ){
					
						cube.cubelets[ 21 ] = swap[ 23 ]
						cube.cubelets[ 22 ] = swap[ 14 ]
						cube.cubelets[ 23 ] = swap[  5 ]
						cube.cubelets[ 12 ] = swap[ 22 ]
						cube.cubelets[ 14 ] = swap[  4 ]
						cube.cubelets[  3 ] = swap[ 21 ]
						cube.cubelets[  4 ] = swap[ 12 ]
						cube.cubelets[  5 ] = swap[  3 ]
					}
					if( degrees === undefined ) degrees = cube.equator.getDistanceToPeg( 'y' )
					cube.equator.cubelets.forEach( function( cubelet, i ){

						if( i === cube.equator.cubelets.length - 1 ) cubelet.rotate( 'y', degrees, onTwistComplete )
						else cubelet.rotate( 'y', degrees )
					})
				}
				else if( command === 'e' && !cube.equator.isEngagedX() && !cube.equator.isEngagedZ() ){
					
					onTwistComplete = function( swap ){

						cube.cubelets[ 21 ] = swap[  3 ]
						cube.cubelets[ 22 ] = swap[ 12 ]
						cube.cubelets[ 23 ] = swap[ 21 ]
						cube.cubelets[ 12 ] = swap[  4 ]
						cube.cubelets[ 14 ] = swap[ 22 ]
						cube.cubelets[  3 ] = swap[  5 ]
						cube.cubelets[  4 ] = swap[ 14 ]
						cube.cubelets[  5 ] = swap[ 23 ]
					}
					if( degrees === undefined ) degrees = cube.equator.getDistanceToPeg( 'Y' )
					cube.equator.cubelets.forEach( function( cubelet, i ){

						if( i === cube.equator.cubelets.length - 1 ) cubelet.rotate( 'Y', degrees, onTwistComplete )
						else cubelet.rotate( 'Y', degrees )
					})
				}
				else if( command === 'D' && !cube.down.isEngagedX() && !cube.down.isEngagedZ() ){

					onTwistComplete = function( swap ){

						cube.cubelets[  6 ] = swap[ 24 ]
						cube.cubelets[  7 ] = swap[ 15 ]
						cube.cubelets[  8 ] = swap[  6 ]
						cube.cubelets[ 15 ] = swap[ 25 ]
						cube.cubelets[ 17 ] = swap[  7 ]
						cube.cubelets[ 24 ] = swap[ 26 ]
						cube.cubelets[ 25 ] = swap[ 17 ]
						cube.cubelets[ 26 ] = swap[  8 ]
					}
					if( degrees === undefined ) degrees = cube.down.getDistanceToPeg( 'y' )
					cube.down.cubelets.forEach( function( cubelet, i ){

						if( i === cube.down.cubelets.length - 1 ) cubelet.rotate( 'y', degrees, onTwistComplete )
						else cubelet.rotate( 'y', degrees )
					})
				}
				else if( command === 'd' && !cube.down.isEngagedX() && !cube.down.isEngagedZ() ){
					
					onTwistComplete = function( swap ){

						cube.cubelets[  6 ] = swap[  8 ]
						cube.cubelets[  7 ] = swap[ 17 ]
						cube.cubelets[  8 ] = swap[ 26 ]
						cube.cubelets[ 15 ] = swap[  7 ]
						cube.cubelets[ 17 ] = swap[ 25 ]
						cube.cubelets[ 24 ] = swap[  6 ]
						cube.cubelets[ 25 ] = swap[ 15 ]
						cube.cubelets[ 26 ] = swap[ 24 ]
					}
					if( degrees === undefined ) degrees = cube.down.getDistanceToPeg( 'Y' )
					cube.down.cubelets.forEach( function( cubelet, i ){

						if( i === cube.down.cubelets.length - 1 ) cubelet.rotate( 'Y', degrees, onTwistComplete )
						else cubelet.rotate( 'Y', degrees )
					})
				}


				//  Z-axis rotations

				if( command === 'Z' && !cube.isEngagedX() && !cube.isEngagedY() ){
			
					onTwistComplete = function( swap ){
						
						cube.cubelets = [

							swap[  6 ], swap[  3 ], swap[  0 ],
							swap[  7 ], swap[  4 ], swap[  1 ],
							swap[  8 ], swap[  5 ], swap[  2 ],

							swap[ 15 ], swap[ 12 ], swap[  9 ],
							swap[ 16 ], swap[ 13 ], swap[ 10 ],
							swap[ 17 ], swap[ 14 ], swap[ 11 ],

							swap[ 24 ], swap[ 21 ], swap[ 18 ],
							swap[ 25 ], swap[ 22 ], swap[ 19 ],
							swap[ 26 ], swap[ 23 ], swap[ 20 ]
						]
					}
					if( degrees === undefined ) degrees = cube.getDistanceToPeg( 'Z' )
					cube.cubelets.forEach( function( cubelet, i ){

						if( i === cube.cubelets.length - 1 ) cubelet.rotate( 'Z', degrees, onTwistComplete )
						else cubelet.rotate( 'Z', degrees )
					})
				}
				else if( command === 'z' && !cube.isEngagedX() && !cube.isEngagedY() ){

					onTwistComplete = function( swap ){

						cube.cubelets = [

							swap[  2 ], swap[  5 ], swap[  8 ],
							swap[  1 ], swap[  4 ], swap[  7 ],
							swap[  0 ], swap[  3 ], swap[  6 ],

							swap[ 11 ], swap[ 14 ], swap[ 17 ],
							swap[ 10 ], swap[ 13 ], swap[ 16 ],
							swap[  9 ], swap[ 12 ], swap[ 15 ],

							swap[ 20 ], swap[ 23 ], swap[ 26 ],
							swap[ 19 ], swap[ 22 ], swap[ 25 ],
							swap[ 18 ], swap[ 21 ], swap[ 24 ]
						]
					}
					if( degrees === undefined ) degrees = cube.getDistanceToPeg( 'z' )
					cube.cubelets.forEach( function( cubelet, i ){

						if( i === cube.cubelets.length - 1 ) cubelet.rotate( 'z', degrees, onTwistComplete )
						else cubelet.rotate( 'z', degrees )
					})
				}
				else if( command === 'F' && !cube.front.isEngagedX() && !cube.front.isEngagedY() ){

					onTwistComplete = function( swap ){

						cube.cubelets[  0 ] = swap[  6 ]
						cube.cubelets[  1 ] = swap[  3 ]
						cube.cubelets[  2 ] = swap[  0 ]
						cube.cubelets[  3 ] = swap[  7 ]
						cube.cubelets[  5 ] = swap[  1 ]
						cube.cubelets[  6 ] = swap[  8 ]
						cube.cubelets[  7 ] = swap[  5 ]
						cube.cubelets[  8 ] = swap[  2 ]
					}
					if( degrees === undefined ) degrees = cube.front.getDistanceToPeg( 'Z' )
					cube.front.cubelets.forEach( function( cubelet, i ){

						if( i === cube.front.cubelets.length - 1 ) cubelet.rotate( 'Z', degrees, onTwistComplete )
						else cubelet.rotate( 'Z', degrees )
					})
				}
				else if( command === 'f' && !cube.front.isEngagedX() && !cube.front.isEngagedY() ){

					onTwistComplete = function( swap ){

						cube.cubelets[  0 ] = swap[  2 ]
						cube.cubelets[  1 ] = swap[  5 ]
						cube.cubelets[  2 ] = swap[  8 ]
						cube.cubelets[  3 ] = swap[  1 ]
						cube.cubelets[  5 ] = swap[  7 ]
						cube.cubelets[  6 ] = swap[  0 ]
						cube.cubelets[  7 ] = swap[  3 ]
						cube.cubelets[  8 ] = swap[  6 ]
					}
					if( degrees === undefined ) degrees = cube.front.getDistanceToPeg( 'z' )
					cube.front.cubelets.forEach( function( cubelet, i ){

						if( i === cube.front.cubelets.length - 1 ) cubelet.rotate( 'z', degrees, onTwistComplete )
						else cubelet.rotate( 'z', degrees )
					})
				}
				else if( command === 'S' && !cube.standing.isEngagedX() && !cube.standing.isEngagedY() ){

					onTwistComplete = function( swap ){

						cube.cubelets[  9 ] = swap[ 15 ]
						cube.cubelets[ 10 ] = swap[ 12 ]
						cube.cubelets[ 11 ] = swap[  9 ]
						cube.cubelets[ 12 ] = swap[ 16 ]
						cube.cubelets[ 14 ] = swap[ 10 ]
						cube.cubelets[ 15 ] = swap[ 17 ]
						cube.cubelets[ 16 ] = swap[ 14 ]
						cube.cubelets[ 17 ] = swap[ 11 ]
					}
					if( degrees === undefined ) degrees = cube.standing.getDistanceToPeg( 'Z' )
					cube.standing.cubelets.forEach( function( cubelet, i ){

						if( i === cube.standing.cubelets.length - 1 ) cubelet.rotate( 'Z', degrees, onTwistComplete )
						else cubelet.rotate( 'Z', degrees )
					})
				}
				else if( command === 's' && !cube.standing.isEngagedX() && !cube.standing.isEngagedY() ){

					onTwistComplete = function( swap ){

						cube.cubelets[  9 ] = swap[ 11 ]
						cube.cubelets[ 10 ] = swap[ 14 ]
						cube.cubelets[ 11 ] = swap[ 17 ]
						cube.cubelets[ 12 ] = swap[ 10 ]
						cube.cubelets[ 14 ] = swap[ 16 ]
						cube.cubelets[ 15 ] = swap[  9 ]
						cube.cubelets[ 16 ] = swap[ 12 ]
						cube.cubelets[ 17 ] = swap[ 15 ]
					}
					if( degrees === undefined ) degrees = cube.standing.getDistanceToPeg( 'z' )
					cube.standing.cubelets.forEach( function( cubelet, i ){

						if( i === cube.standing.cubelets.length - 1 ) cubelet.rotate( 'z', degrees, onTwistComplete )
						else cubelet.rotate( 'z', degrees )
					})
				}
				else if( command === 'B' && !cube.back.isEngagedX() && !cube.back.isEngagedY() ){

					onTwistComplete = function( swap ){

						cube.cubelets[ 18 ] = swap[ 20 ]
						cube.cubelets[ 19 ] = swap[ 23 ]
						cube.cubelets[ 20 ] = swap[ 26 ]
						cube.cubelets[ 21 ] = swap[ 19 ]
						cube.cubelets[ 23 ] = swap[ 25 ]
						cube.cubelets[ 24 ] = swap[ 18 ]
						cube.cubelets[ 25 ] = swap[ 21 ]
						cube.cubelets[ 26 ] = swap[ 24 ]
					}
					if( degrees === undefined ) degrees = cube.back.getDistanceToPeg( 'z' )
					cube.back.cubelets.forEach( function( cubelet, i ){

						if( i === cube.back.cubelets.length - 1 ) cubelet.rotate( 'z', degrees, onTwistComplete )
						else cubelet.rotate( 'z', degrees )
					})
				}
				else if( command === 'b' && !cube.back.isEngagedX() && !cube.back.isEngagedY() ){

					onTwistComplete = function( swap ){

						cube.cubelets[ 18 ] = swap[ 24 ]
						cube.cubelets[ 19 ] = swap[ 21 ]
						cube.cubelets[ 20 ] = swap[ 18 ]
						cube.cubelets[ 21 ] = swap[ 25 ]
						cube.cubelets[ 23 ] = swap[ 19 ]
						cube.cubelets[ 24 ] = swap[ 26 ]
						cube.cubelets[ 25 ] = swap[ 23 ]
						cube.cubelets[ 26 ] = swap[ 20 ]
					}
					if( degrees === undefined ) degrees = cube.back.getDistanceToPeg( 'Z' )
					cube.back.cubelets.forEach( function( cubelet, i ){

						if( i === cube.back.cubelets.length - 1 ) cubelet.rotate( 'Z', degrees, onTwistComplete )
						else cubelet.rotate( 'Z', degrees )
					})
				}


				//@@  COME BACK AND BETTER DOCUMENT WHAT'S HAPPENING HERE!


				if( onTwistComplete instanceof Function ){

					twist.completed = Date.now()
					$( '#twist' ).text( command ).fadeIn( 50, function(){ 

						var that = this
						setTimeout( function(){

							$( that ).fadeOut( 500 )
						
						}, 50 )
					})				
				}
				else console.log( '! Received a twist command ('+ command +'), however some of the required Cubelets are currently engaged.' )
			}
			else if( erno.verbosity >= 0.8 ) console.log( '! Received an invalid twist command: '+ command +'.' )
		},




		showFaceLabels: function(){

			$( '.faceLabel' ).show()
			this.showingFaceLabels = true
		},
		hideFaceLabels: function(){

			$( '.faceLabel' ).hide()
			this.showingFaceLabels = false
		},






		    /////////////////
		   //             //
		  //   Presets   //
		 //             //
		/////////////////


		presetBling: function(){

			var cube = this

			this.threeObject.position.y = -2000
			new TWEEN.Tween( this.threeObject.position )
				.to({ 
					y: 0
				}, SECOND * 2 )
				.easing( TWEEN.Easing.Quartic.Out )
				.start()
			this.threeObject.rotation.set(
				
				( 180 ).degreesToRadians(),
				( 180 ).degreesToRadians(),
				(  20 ).degreesToRadians()
			)
			new TWEEN.Tween( this.threeObject.rotation )
				.to({ 

					x: (  25 ).degreesToRadians(), 
					y: ( -30 ).degreesToRadians(),
					z: 0

				}, SECOND * 3 )
				.easing( TWEEN.Easing.Quartic.Out )
				.onComplete( function(){

					cube.isReady = true
					updateControls()
				})
				.start()
			this.isReady = false

			
			//  And we want each Cubelet to begin in an exploded position and tween inward.

			this.cubelets.forEach( function( cubelet ){
	

				//  We want to start with each Cubelet exploded out away from the Cube center.
				//  We're reusing the x, y, and z we created far up above to handle Cubelet positions.

				var distance = 1000
				cubelet.anchor.position.set(

					cubelet.addressX * distance,
					cubelet.addressY * distance,
					cubelet.addressZ * distance
				)


				//  Let's vary the arrival time of flying Cubelets based on their type.
				//  An nice extra little but of sauce!

				var delay
				if( cubelet.type === 'core'   ) delay = (   0 ).random(  200 )
				if( cubelet.type === 'center' ) delay = ( 200 ).random(  400 )
				if( cubelet.type === 'edge'   ) delay = ( 400 ).random(  800 )
				if( cubelet.type === 'corner' ) delay = ( 800 ).random( 1000 )


				new TWEEN.Tween( cubelet.anchor.position )
					.to({

						x: 0,
						y: 0,
						z: 0
					
					}, SECOND )
					.delay( delay ) 
					.easing( TWEEN.Easing.Quartic.Out )	
					.onComplete( function(){

						cubelet.isTweening = false
					})
					.start()
				
				cubelet.isTweening = true
			})
			updateControls( this )
		},
		presetNormal: function(){

			$( 'body' ).css( 'background-color', '#000' )
			$( 'body' ).addClass( 'graydient' )
			setTimeout( function(){ $( '.cubelet' ).removeClass( 'purty' )}, 1 )
			this.show()
			this.showIntroverts()
			this.showPlastics()
			this.showStickers()
			this.hideTexts()
			this.hideWireframes()
			this.hideIds()
			this.setOpacity()
			this.setRadius()
			updateControls( this )
		},
		presetText: function( virgin ){

			$( 'body' ).css( 'background-color', '#F00' )
			$( 'body' ).removeClass( 'graydient' )
			setTimeout( function(){ $( '.cubelet' ).removeClass( 'purty' )}, 1 )

			var cube = this

			setTimeout( function(){
	
				cube.show()
				cube.hidePlastics()
				cube.hideStickers()
				cube.hideIds()
				cube.hideIntroverts()
				cube.showTexts()
				cube.hideWireframes()
				cube.setOpacity()
				updateControls( cube )
			
			}, 1 )
		},
		presetLogo: function(){

			var cube = this

			this.isReady = false
			this.presetText()			
			new TWEEN.Tween( cube.threeObject.rotation )
			.to({ 
				x: 0,
				y: ( -45 ).degreesToRadians(),
				z: 0
			}, SECOND * 2 )
			.easing( TWEEN.Easing.Quartic.Out )
			.onComplete( function(){

				updateControls( cube )
				cube.isReady = true
				cube.twistQueue.add( 'E20d17' )
			})
			.start()
		},
		presetTextAnimate: function(){//  Specifically for Monica!

			var 
			delay = 1,//SECOND * 2,
			twistDurationScaled = [ (20+90).absolute().scale( 0, 90, 0, cube.twistDuration ), 250 ].maximum()
			_this = this

			cube.shuffleMethod = cube.ALL_SLICES
			presetHeroic( virgin )
			setTimeout( function(){ 

				_this.twist( 'E', 20 )
			}, delay )
			setTimeout( function(){ 

				_this.twist( 'd', 20 )
				//$('body').css('background-color', '#000')
			}, delay + SECOND )
			setTimeout( function(){

				_this.twist( 'D', 20 + 90 )		
				_this.isRotating = true
			}, delay + SECOND * 2 )
			setTimeout( function(){

				_this.twist( 'e', 20 + 90 )
				_this.isShuffling = true
			}, delay + SECOND * 2 + twistDurationScaled + 50 )
			updateControls( this )
		},
		presetWireframe: function( included, excluded ){

			setTimeout( function(){ $( '.cubelet' ).removeClass( 'purty' )}, 1 )
			this.showIntroverts()
			if( included === undefined ) included = new Group( this.cubelets )
			if( excluded === undefined ){

				excluded = new Group( this.cubelets )
				excluded.remove( included )
			}						
			this.show()		
			excluded.showPlastics()
			excluded.showStickers()
			excluded.hideWireframes()
			included.hidePlastics()
			included.hideStickers()
			included.showWireframes()
			updateControls( this )
		},
		presetHighlight: function( included, excluded ){

			if( erno.state === 'setup' ) this.presetBling()
			if( included === undefined ) included = new Group( this.cubelets )
			if( excluded === undefined ){

				excluded = new Group( this.cubelets )
				excluded.remove( included )
			}
			excluded.setOpacity( 0.1 )
			included.setOpacity()
			updateControls( this )
		},
		presetHighlightCore: function(){

			this.presetHighlight( this.core )
			updateControls( this )
		},
		presetHighlightCenters: function(){

			this.presetHighlight( this.centers )
			updateControls( this )
		},
		presetHighlightEdges: function(){

			this.presetHighlight( this.edges )
			updateControls( this )
		},
		presetHighlightCorners: function(){

			this.presetHighlight( this.corners )
			updateControls( this )
		},
		presetHighlightWhite: function(){

			this.presetHighlight( this.hasColor( WHITE ))
			updateControls( this )
		},
		presetPurty: function(){

			this.showIntroverts()
			setTimeout( function(){ 
				
				$( '.cubelet' ).addClass( 'purty' )

			}, 1 )
			this.threeObject.rotation.set(

				( 35.3).degreesToRadians(),
				(-45  ).degreesToRadians(),
				   0
			)
			updateControls( this )
		},
		presetDemo: function(){

			var 
			cube  = this,
			loops = 0,
			captions = $( '#captions' )

			this.taskQueue.add(


				//  Rotation and twist demo.

				function(){

					cube.rotationDeltaX = -0.1
					cube.rotationDeltaY = 0.15
					cube.isRotating = true
					cube.presetNormal()
					cube.taskQueue.isReady = false
					setTimeout( function(){ cube.taskQueue.isReady = true }, SECOND )
				},
				function(){

					cube.twistQueue.add( 'rdRD'.multiply( 6 ))
				},


				//  Opacity demo.
				
				function(){

					cube.back.setOpacity( 0.2 )
					cube.taskQueue.isReady = false					
					setTimeout( function(){ cube.taskQueue.isReady = true }, SECOND )
				},
				function(){

					cube.standing.setOpacity( 0.2 )
					cube.taskQueue.isReady = false
					setTimeout( function(){ cube.taskQueue.isReady = true }, SECOND )
				},
				function(){

					cube.twistQueue.add( 'rdRD'.multiply( 3 ))
				},
				function(){

					cube.showFaceLabels()
					cube.twistQueue.add( 'rdRD'.multiply( 3 ))
				},
				function(){

					cube.hideFaceLabels()
					cube.standing.setOpacity( 1 )
					cube.taskQueue.isReady = false
					setTimeout( function(){ cube.taskQueue.isReady = true }, SECOND )
				},
				function(){

					cube.back.setOpacity( 1 )
					cube.taskQueue.isReady = false
					setTimeout( function(){ cube.taskQueue.isReady = true }, SECOND )
				},


				//  Radial demo.

				function(){

					cube.down.setRadius( 90 )
					cube.taskQueue.isReady = false
					setTimeout( function(){ cube.taskQueue.isReady = true }, SECOND )
				},
				function(){

					cube.equator.setRadius( 90 )
					cube.taskQueue.isReady = false
					setTimeout( function(){ cube.taskQueue.isReady = true }, SECOND )
				},
				function(){

					cube.up.setRadius( 90 )
					cube.taskQueue.isReady = false
					setTimeout( function(){ cube.taskQueue.isReady = true }, SECOND )
				},
				function(){

					cube.twistQueue.add( 'rdRD'.multiply( 2 ))
				},
				function(){

					cube.back.setRadius()
					cube.taskQueue.isReady = false
					setTimeout( function(){ cube.taskQueue.isReady = true }, SECOND )
				},
				function(){

					cube.standing.setRadius()
					cube.taskQueue.isReady = false
					setTimeout( function(){ cube.taskQueue.isReady = true }, SECOND )
				},
				function(){

					cube.twistQueue.add( 'rdRD'.multiply( 2 ))
				},
				function(){

					var 
					excluded = new Group( cube.cubelets ),
					included = cube.hasColors( RED, YELLOW, BLUE )

					excluded.remove( included )
					excluded.setRadius()
					excluded.setOpacity( 0.5 )
					included.setRadius( 120 )
					included.setOpacity( 1 )

					cube.back.setRadius()
					cube.showIds()
					cube.taskQueue.isReady = false
					setTimeout( function(){ cube.taskQueue.isReady = true }, (6).seconds() )
				},
				function(){

					cube.twistQueue.add( 'rdRD'.multiply( 2 ))
				},
				function(){

					cube.taskQueue.isReady = false
					setTimeout( function(){ cube.taskQueue.isReady = true }, (6).seconds() )
				},
				function(){

					cube.setRadius()
					cube.taskQueue.isReady = false
					setTimeout( function(){ cube.taskQueue.isReady = true }, (3).seconds() )
				},


				//  A cube is made up of cubelets
				//  and these can be a core or centers, edges, and corners.

				function(){
					
					captions.text( 'Core' ).fadeIn()
					cube.presetHighlightCore()
					cube.taskQueue.isReady = false
					setTimeout( function(){ cube.taskQueue.isReady = true }, SECOND )					
				},
				function(){
					
					cube.showIds()
					cube.taskQueue.isReady = false
					setTimeout( function(){ cube.taskQueue.isReady = true }, (2).seconds() )	
				},
				function(){

					cube.twistQueue.add( 'rdRD'.multiply( 2 ))
				},
				function(){

					captions.text( 'Centers' )
					cube.presetHighlightCenters()
					cube.twistQueue.add( 'rdRD'.multiply( 4 ))
				},
				function(){

					captions.text( 'Edges' )
					cube.presetHighlightEdges()
					cube.twistQueue.add( 'rdRD'.multiply( 3 ))
				},
				function(){

					captions.text( 'Corners' )
					cube.presetHighlightCorners()
					cube.twistQueue.add( 'rdRD'.multiply( 3 ))
				},
				function(){
					
					captions.fadeOut()
					cube.taskQueue.isReady = false
					setTimeout( function(){ cube.taskQueue.isReady = true }, (2).seconds() )	
				},


				//  Wireframe demo.
				
				function(){

					cube.left.setOpacity( 0 )
					cube.taskQueue.isReady = false
					setTimeout( function(){ cube.taskQueue.isReady = true }, SECOND )
				},
				function(){

					cube.left
						.hidePlastics()
						.hideStickers()
						.showWireframes()
						.showIds()
						.setOpacity( 1 )
					cube.taskQueue.isReady = false
					setTimeout( function(){ cube.taskQueue.isReady = true }, SECOND )
				},
				function(){

					cube.middle.setOpacity( 0 )
					cube.taskQueue.isReady = false
					setTimeout( function(){ cube.taskQueue.isReady = true }, SECOND )
				},
				function(){
					
					cube.middle
						.hidePlastics()
						.hideStickers()
						.showWireframes()
						.showIds()
						.setOpacity( 1 )
					cube.taskQueue.isReady = false
					setTimeout( function(){ cube.taskQueue.isReady = true }, SECOND )
				},
				function(){

					cube.right.setOpacity( 0 )
					cube.taskQueue.isReady = false
					setTimeout( function(){ cube.taskQueue.isReady = true }, SECOND )
				},
				function(){

					cube.right
						.hidePlastics()
						.hideStickers()
						.showWireframes()
						.showIds()
						.setOpacity( 1 )
					cube.taskQueue.isReady = false
					setTimeout( function(){ cube.taskQueue.isReady = true }, SECOND )
				},
				function(){

					cube.twistQueue.add( 'rdRD'.multiply( 3 ))
				},


				//  Text demo.

				function(){

					cube.left.setOpacity( 0 )
					cube.taskQueue.isReady = false
					setTimeout( function(){ cube.taskQueue.isReady = true }, SECOND )
				},
				function(){

					cube.left
						.hidePlastics()
						.hideStickers()
						.hideWireframes()
						.hideIds()
						.showTexts()
						.setOpacity( 1 )
					cube.taskQueue.isReady = false
					setTimeout( function(){ cube.taskQueue.isReady = true }, SECOND )
				},
				function(){

					cube.middle.setOpacity( 0 )
					cube.taskQueue.isReady = false
					setTimeout( function(){ cube.taskQueue.isReady = true }, SECOND )
				},
				function(){
					
					cube.middle
						.hidePlastics()
						.hideStickers()
						.hideWireframes()
						.hideIds()
						.showTexts()
						.setOpacity( 1 )
					cube.taskQueue.isReady = false
					setTimeout( function(){ cube.taskQueue.isReady = true }, SECOND )
				},
				function(){

					cube.right.setOpacity( 0 )
					cube.taskQueue.isReady = false
					setTimeout( function(){ cube.taskQueue.isReady = true }, SECOND )
				},
				function(){

					cube.right
						.hidePlastics()
						.hideStickers()
						.hideWireframes()
						.hideIds()
						.showTexts()
						.setOpacity( 1 )
					cube.taskQueue.isReady = false
					setTimeout( function(){ cube.taskQueue.isReady = true }, SECOND )
				},
				function(){

					cube.twistQueue.add( 'rdRD'.multiply( 3 ))
				},
				function(){

					cube.taskQueue.isReady = false
					setTimeout( function(){ cube.taskQueue.isReady = true }, SECOND * 8 )
				},


				//  Return to Normal mode

				function(){

					cube.left.setOpacity( 0 )
					cube.taskQueue.isReady = false
					setTimeout( function(){ cube.taskQueue.isReady = true }, SECOND )
				},
				function(){

					cube.left
						.showPlastics()
						.showStickers()
						.hideTexts()
						.setOpacity( 1 )
					cube.taskQueue.isReady = false
					setTimeout( function(){ cube.taskQueue.isReady = true }, SECOND )
				},
				function(){

					cube.middle.setOpacity( 0 )
					cube.taskQueue.isReady = false
					setTimeout( function(){ cube.taskQueue.isReady = true }, SECOND )
				},
				function(){
					
					cube.middle
						.showPlastics()
						.showStickers()
						.hideTexts()
						.setOpacity( 1 )
					cube.taskQueue.isReady = false
					setTimeout( function(){ cube.taskQueue.isReady = true }, SECOND )
				},
				function(){

					cube.right.setOpacity( 0 )
					cube.taskQueue.isReady = false
					setTimeout( function(){ cube.taskQueue.isReady = true }, SECOND )
				},
				function(){

					cube.right
						.showPlastics()
						.showStickers()
						.hideTexts()
						.setOpacity( 1 )
					cube.taskQueue.isReady = false
					setTimeout( function(){ cube.taskQueue.isReady = true }, SECOND )
				},


				//  Loop it.

				function(){

					loops ++
					console.log( 'The cuber demo has completed', loops, 'loops.' )
					cube.twistQueue.history = []//  Lets just kill it outright.
				}
			)
			this.taskQueue.isLooping = true
			updateControls( this )
		},
		presetDemoStop: function(){

			this.taskQueue.isLooping = false
			this.twistQueue.empty()
			this.taskQueue.empty()
			this.isRotating = false
			updateControls( this )
		},








		//  Shuffle methods.

		PRESERVE_LOGO: 'RrLlUuDdSsBb',            //  Preserve the logo position and rotation.
		ALL_SLICES:    'RrMmLlUuEeDdFfSsBb',      //  Allow all slices to rotate.
		EVERYTHING:    'XxRrMmLlYyUuEeDdZzFfSsBb',//  Allow all slices, and also full cube X, Y, and Z rotations.


		//  The cube does its own loopage.
		//  It attempts to execute twists in the twistQueue
		//  and then tasks in the taskQueue.
		//  This is how shuffling and solving are handled.

		loop: function(){

			if( cube.isRotating ){

				cube.threeObject.rotation.x += cube.rotationDeltaX.degreesToRadians()
				cube.threeObject.rotation.y += cube.rotationDeltaY.degreesToRadians()
				cube.threeObject.rotation.z += cube.rotationDeltaZ.degreesToRadians()
				updateControls()
			}


			//  If the Cube is "ready"
			//  and not a single cubelet is currently tweening
			//  regardless of it's resting state (engagement;
			//  meanging it could in theory not be tweening but
			//  has come to rest at where rotation % 90 !== 0.

			if( cube.isReady && !cube.isTweening() ){
	
				$( '#cubeIsTweening' ).fadeOut( 100 )
				if( cube.twistQueue.isReady ){


					//  We have zero twists in the queue
					//  so perhaps we'd like to add some?

					if( cube.twistQueue.future.length === 0 ){

						$( '#cubeHasTwistsQueued' ).fadeOut( 100 )


						//  If the Cube ought to be shuffling then
						//  add a random command to the twist queue.

						if( cube.isShuffling ){

							cube.twistQueue.add( cube.shuffleMethod[ cube.shuffleMethod.length.rand() ])
						}
						
						//  If the cube ought to be solving and a solver exists
						//  and we're not shuffling, tweening, etc.

						else if( cube.isSolving && window.solver ){

							cube.isSolving = window.solver.consider( cube )
						}

						//  If we are doing absolutely nothing else
						//  then we can can try executing a task.

						else if( cube.taskQueue.isReady === true ){

							var task = cube.taskQueue.do()
							if( task instanceof Function ) task()
						}					 
					}

					//  Otherwise, we have some twists in the queue
					//  and we should put everything else aside and tend to those.

					else {
						
						cube.twist( cube.twistQueue.do() )
						if( cube.twistQueue.future.length > 0 ) $( '#cubeHasTwistsQueued' ).fadeIn( 100 )
					}


				}// cube.twistQueue.isReady
			}
			else if( cube.isTweening ){

				$( '#cubeIsTweening' ).fadeIn( 100 )
			}
		}// loop: function()




	})
})



