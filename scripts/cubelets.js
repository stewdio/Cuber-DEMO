/*


	CUBELETS

	Faces are mapped in a clockwise spiral from Front to Back:


                  Back
                   5
              -----------
            /    Up     /|
           /     1     / |
           -----------  Right
          |           |  2
    Left  |   Front   |  .
     4    |     0     | /
          |           |/
           -----------
               Down
                3

	
	The faces[] Array is mapped to names for convenience:

	  this.faces[ 0 ] === this.front
	  this.faces[ 1 ] === this.up
	  this.faces[ 2 ] === this.right
	  this.faces[ 3 ] === this.down
	  this.faces[ 4 ] === this.left
	  this.faces[ 5 ] === this.back
	
	
	Each Cubelet has an Index which is assigned during Cube creation
	and an Address which changes as the Cubelet changes location.
	Additionally an AddressX, AddressY, and AddressZ are calculated 
	from the Address and represent the Cubelet's location relative
	to the Cube's core with integer values ranging from -1 to +1.
	For an overview of the Cubelet's data from the browser's console:

	  this.inspect()




*/








function Cubelet( cube, id, colors ){


	//  Our Cube can directly address its Cubelet children,
	//  only fair the Cubelet can address their parent Cube!

	this.cube = cube
	

	//  Our Cubelet's ID is its unique number on the Cube.
	//  Each Cube has Cubletes numbered 0 through 26.
	//  Even if we're debugging (and not attached to an actual Cube)
	//  we need an ID number for later below
	//  when we derive positions and rotations for the Cubelet faces.

	this.id = id || 0


	//  Our Cubelet's address is its current location on the Cube.
	//  When the Cubelet is initialized its ID and address are the same.
	//  This method will also set the X, Y, and Z components of the
	//  Cubelet's address on the Cube.

	this.setAddress( this.id )


	//  We're going to build Cubelets that are 140 pixels square.
	//  Yup. This size is hardwired in Cube.
	//  It is also hard-wired into the CSS, but we can't simply
	//  grab the style.getBoundingClientRect() value because 
	//  that's a 2D measurement -- doesn't account for pos and rot.
	
	this.size = cube.cubeletSize || 140


	//  Now we can find our Cubelet's X, Y, and Z position in space.
	//  We only need this momentarily to create our Object3D so
	//  there's no need to attach these properties to our Cubelet object.

	var
	x = this.addressX * this.size,
	y = this.addressY * this.size,
	z = this.addressZ * this.size


	//  For convenience here are maps for rotating and positioning
	//  the Cubelet face wall into place.

	var	
	half = this.size / 2,
	rotations = [

		[   0,   0, 0 ],//  Front
		[ -90,   0, 0 ],//  Up
		[   0,  90, 0 ],//  Right
		[  90,   0, 0 ],//  Down
		[   0, -90, 0 ],//  Left
		[   0, 180, 0 ] //  Back
	],
	positions = [

		[  0,     0,    half ],//  Front
		[  0,    -half, 0    ],//  Up
		[  half,  0,    0    ],//  Right
		[  0,     half, 0    ],//  Down
		[ -half,  0,    0    ],//  Left
		[  0,     0,   -half ] //  Back
	]


	//  Our anchor only achieves rotation during a tween animation.
	//  It is then immediately reset to rotation( 0, 0, 0 )
	// (and its rotation information is applied to the wrapper at that moment)
	//  and thus can be used as a reliable anchor in space repeatedly.

	this.anchor = new THREE.Object3D()
	this.anchor.name = 'anchor-' + this.id
	if( this.cube )	this.cube.threeObject.add( this.anchor )
	else scene.add( this.anchor )



	if( erno.renderMode === 'css' ){
	
		var domElement = document.createElement( 'div' )
		domElement.classList.add( 'cubelet' )
		domElement.classList.add( 'cubeletId-'+ this.id )
		this.wrapper = new THREE.CSS3DObject( domElement )
	}
	else if( erno.renderMode === 'svg' ){
		
		this.wrapper = new THREE.Object3D()


		//  Create this Cubelet's plastic shell.

		this.plastic = new THREE.Mesh( 

			new THREE.CubeGeometry( cube.cubeletSize, cube.cubeletSize, cube.cubeletSize ),
			new THREE.MeshBasicMaterial({ color: 0xFFFFFF, vertexColors: THREE.FaceColors })
		)
		this.plastic.position.set( x, y, z )
		this.wrapper.add( this.plastic )


		//  Wireframe!

		this.wireframe = new THREE.Mesh( 

			new THREE.CubeGeometry( cube.cubeletSize, cube.cubeletSize, cube.cubeletSize ),
			new THREE.MeshBasicMaterial({ color: 0x00CCFF, wireframe: true })
		)
		this.wireframe.position.set( x, y, z )
		this.wrapper.add( this.wireframe )
	}
	this.wrapper.name = 'wrapper-' + this.id
	this.wrapper.position.set( x, y, z )
	this.anchor.add( this.wrapper )






	//@@@  QUICK HACK TO FORCE A CUBE TO APPEAR FOR HIT TESTING WITH RAYCASTING!!!

	/*if( this.plastic === undefined ){
	
		this.plastic = new THREE.Mesh( 

			new THREE.CubeGeometry( cube.cubeletSize, cube.cubeletSize, cube.cubeletSize ),
			new THREE.MeshBasicMaterial({ color: 0xFF00FF, vertexColors: THREE.FaceColors })
		)
		this.plastic.position.set( x, y, z )
		this.wrapper.add( this.plastic )
	}*/








	//  We're about to loop through our colors[] Array
	//  to build the six faces of our Cubelet.
	//  Here's our overhead for that:

	var extrovertedFaces = 0
	if( colors === undefined ) colors = [ W, O,  ,  , G, ]
	this.faces = []


	//  Now let's map one color per side based on colors[].
	//  Undefined values are allowed (and anticipated).
	//  We need to loop through the colors[] Array "manually"
	//  because Array.forEach() would skip the undefined entries.

	for( var i = 0; i < 6; i ++ ){


		//  Before we create our face's THREE object
		//  we need to know where it should be positioned and rotated.
		// (This is based on our above positions and rotations map.)

		var
		color  = colors[ i ] || COLORLESS
		

		//  Each face is an object and keeps track of its original ID number
		// (which is important because its address will change with each rotation)
		//  its current color, and so on.

		this.faces[ i ] = {}
		this.faces[ i ].id = i
		this.faces[ i ].color = color
		

		//  We're going to keep track of what face was what at the moment of initialization,
		//  mostly for solving purposes.
		//  This is particularly useful for Striegel's solver
		//  which requires an UP normal.

		this.faces[ i ].normal = Direction.getNameById( i )


		if( erno.renderMode === 'css' ){


			//  FACE CONTAINER.
			//  This face of our Cubelet needs a DOM element for all the
			//  related DOM elements to be attached to.

			var faceElement = document.createElement( 'div' )
			faceElement.classList.add( 'face' )
			faceElement.classList.add( 'face'+ Direction.getNameById( i ).capitalize() )
			this.wrapper.element.appendChild( faceElement )


			//  WIREFRAME.

			var wireframeElement = document.createElement( 'div' )
			wireframeElement.classList.add( 'wireframe' )
			faceElement.appendChild( wireframeElement )


			//  CUBELET ID.
			//  For debugging we want the ability to display this Cubelet's ID number
			//  with an underline (to make numbers like 6 and 9 legible upside-down).

			var idElement = document.createElement( 'div' )
			idElement.classList.add( 'id' )
			faceElement.appendChild( idElement )
			
			var underlineElement = document.createElement( 'span' )
			underlineElement.classList.add( 'underline' )
			underlineElement.innerText = this.id
			idElement.appendChild( underlineElement )
		}


		//  INTROVERTED FACES.
		//  If this face has no color sticker then it must be interior to the Cube.
		//  That means in a normal state (no twisting happening) it is entirely hidden.

		if( color === COLORLESS ){

			if( erno.renderMode === 'css' ) faceElement.classList.add( 'faceIntroverted' )
			else {

				this.plastic.geometry.faces[ i ].color.setHex( 0x000000 )
				this.plastic.geometry.colorsNeedUpdate = true
			}
		}


		//  EXTROVERTED FACES.
		//  But if this face does have a color then we need to
		//  create a sticker with that color
		//  and also allow text to be placed on it.

		else {


			//  We're going to use the number of exposed sides
			//  to determine below what 'type' of Cubelet this is:
			//  Core, Center, Edge, or Corner.

			extrovertedFaces ++


			if( erno.renderMode === 'css' ){	

				faceElement.classList.add( 'faceExtroverted' )


				//  STICKER.
				//  You know, the color part that makes the Cube
				//  the most frustrating toy ever.

				var stickerElement = document.createElement( 'div' )
				stickerElement.classList.add( 'sticker' )			
				stickerElement.style.backgroundColor = color.hex
				faceElement.appendChild( stickerElement )


				//  TEXT.
				//  One character per face, mostly for our branding.

				var textElement = document.createElement( 'div' )
				textElement.classList.add( 'text' )
				textElement.innerText = i
				this.faces[ i ].text = textElement
				faceElement.appendChild( textElement )
			}
			else {

				/*
				var sticker = new THREE.Mesh( 

					new THREE.PlaneGeometry( cube.cubeletSize, cube.cubeletSize ),
					new THREE.MeshBasicMaterial({ color: color })
				)
				sticker.material.opacity = 0.7
				sticker.overdraw = true
				sticker.position.set( faceX,  faceY,  faceZ  )
				sticker.rotation.set( faceXR, faceYR, faceZR )
				this.faces[ i ].sticker = sticker
				this.wrapper.add( this.faces[ i ].sticker )
				*/
				//console.log(colorNameToHex( color ))
				//console.log(' ' )
				//console.log(this.plastic.geometry.faces[ i ].color)
				//console.log(colorNameToDecimal( color ))

				//var j = [ 1, 0, 2, 3, 4, 5 ][ i ]
				var j = [ 3,3,3,3,3,3 ][ i ]


				this.plastic.geometry.faces[ j ].color.setHex( colorNameToDecimal( color ))
				//this.plastic.geometry.faces[ i ].color.setHex( 0xFF00FF )
				this.plastic.geometry.colorsNeedUpdate = true
				//console.log(this.plastic.geometry.faces[ i ].color)
				//console.log(' ' )
			}
		}
	}


	//  Now that we've run through our colors[] Array
	//  and counted the number of extroverted sides
	//  we can determine what 'type' of Cubelet this is.

	this.type = [

		'core',
		'center',
		'edge',
		'corner'

	][ extrovertedFaces ]


	//  Mapping the Cubelet will setup all of our convenience shortcuts
	//  like "this.front.color" and "this.left.text" for example.

	this.map()


	//  If this happens to be our logo-bearing Cubelet
	//  we had better attach the logo to it!

	if( this.front.color && this.front.color.name === 'white' && this.type === 'center' ){

		if( erno.renderMode === 'css' ) stickerElement.classList.add( 'stickerLogo' )
	}


	//  We need to know if we're "engaged" on an axis 
	//  which at first seems indentical to isTweening,
	//  until you consider partial rotations. 

	this.isTweening = true
	this.isEngagedX = false
	this.isEngagedY = false
	this.isEngagedZ = false


	//  Remember our separation of state code and visual code?
	//  Well here's some slightly (though not entirely!) redundant
	//  rotation tracking. 
	//  It's actually this that makes partial rotations possible...

	this.x = this.xPrevious = 0
	this.y = this.yPrevious = 0
	this.z = this.zPrevious = 0


	//  These will perform their actions, of course,
	//  but also setup their own boolean toggles.

	this.show()
	this.showPlastics()
	this.showIntroverts()
	this.showStickers()
	this.hideIds()
	this.hideTexts()
	this.hideWireframes()


	//  During a rotation animation this Cubelet marks itself as 
	//  this.isTweening = true. 
	//  Very useful. Let's try it out.

	this.isTweening = false


	//  Some fun tweenable properties.

	this.opacity = 1
	this.radius  = 0
}








setupTasks = window.setupTasks || []
setupTasks.push( function(){


	//  Let's add some functionality to Cubelet's prototype
	//  via the augment() function from Skip.js.
	//  By adding to Cubelet's prototype and not the Cubelet constructor
	//  we're keeping instances of Cubelet super clean and light.

	augment( Cubelet, {


		//  Convience accessors for the Cubelet's faces.
		//  What color is the left face? this.left() !!

		map: function(){

			this.front  = this.faces[ 0 ]
			this.up     = this.faces[ 1 ]
			this.right  = this.faces[ 2 ]
			this.down   = this.faces[ 3 ]
			this.left   = this.faces[ 4 ]
			this.back   = this.faces[ 5 ]
			this.colors = 

				( this.faces[ 0 ].color ? this.faces[ 0 ].color.initial : '-' ) +
				( this.faces[ 1 ].color ? this.faces[ 1 ].color.initial : '-' ) +
				( this.faces[ 2 ].color ? this.faces[ 2 ].color.initial : '-' ) +
				( this.faces[ 3 ].color ? this.faces[ 3 ].color.initial : '-' ) +
				( this.faces[ 4 ].color ? this.faces[ 4 ].color.initial : '-' ) +
				( this.faces[ 5 ].color ? this.faces[ 5 ].color.initial : '-' )
		},


		//  Aside from initialization this function will be called 
		//  by the Cube during remapping.
		//  The raw address is an integer from 0 through 26
		//  mapped to the Cube in the same fashion as this.id.
		//  The X, Y, and Z components each range from -1 through +1
		//  where (0, 0, 0) is the Cube's core.

		setAddress: function( address ){

			this.address  = address || 0
			this.addressX = address.modulo( 3 ).subtract( 1 )
			this.addressY = address.modulo( 9 ).divide( 3 ).roundDown().subtract( 1 ) * -1
			this.addressZ = address.divide( 9 ).roundDown().subtract( 1 ) * -1
		},


		//  Full inspection of the Cublet's faces
		//  using the convenience accessors from above.

		inspect: function( face ){			

			if( face !== undefined ){

				
				//  Just a particular face's color -- called by Slice's inspector.
				
				return this[ face ].color || '!'
			}
			else {
				

				//  Full on ASCII-art inspection mode -- with console colors!

				var
				that    = this,
				id      = this.id,
				address = this.address,
				type    = this.type,
				color   = this.cube.color,				
				LEFT    = 0,
				CENTER  = 1,
				getColorName = function( face, justification, minimumLength ){

					var colorName = that[ face ].color.name.toUpperCase()
					
					if( justification !== undefined && minimumLength !== undefined ){

						if( justification === CENTER ) colorName = colorName.justifyCenter( minimumLength )
						else if( justification === LEFT ) colorName = colorName.justifyLeft( minimumLength )
					}
					return colorName
				}

				if( id < 10 ) id = '0' + id
				if( address < 10 ) address = '0' + address
				console.log(

					'\n    ID         '+ id +
					'\n    Type       '+ type.toUpperCase() +'\n'+

					'\n    Address    '+ address +
					'\n    Address X  '+ this.addressX.toSignedString() +
					'\n    Address Y  '+ this.addressY.toSignedString() +
					'\n    Address Z  '+ this.addressZ.toSignedString() +'\n'+

					'\n    Engaged X  '+ this.isEngagedX +
					'\n    Engaged Y  '+ this.isEngagedY +
					'\n    Engaged Z  '+ this.isEngagedZ +
					'\n    Tweening   '+ this.isTweening +'\n'+
					
					'\n%c 0  Front      '+ getColorName( 'front', LEFT, 7 ) +'%c'+
					'\n%c 1  Up         '+ getColorName( 'up',    LEFT, 7 ) +'%c'+
					'\n%c 2  Right      '+ getColorName( 'right', LEFT, 7 ) +'%c'+
					'\n%c 3  Down       '+ getColorName( 'down',  LEFT, 7 ) +'%c'+
					'\n%c 4  Left       '+ getColorName( 'left',  LEFT, 7 ) +'%c'+
					'\n%c 5  Back       '+ getColorName( 'back',  LEFT, 7 ) +'%c\n' +

					'\n              -----------  %cback%c'+
					'\n            /    %cup%c     /|  %c5%c'+
					'\n           /     %c1%c     / | %c'+ getColorName( 'back' ) +'%c'+
					'\n          /%c'+ getColorName( 'up', CENTER, 11 ) +'%c/  |'+
					'\n  %cleft%c    -----------   %cright%c'+
					'\n   %c4%c     |           |   %c2%c'+
					'\n%c'+ getColorName( 'left', CENTER, 8 ) +'%c |   %cfront%c   |  %c'+ getColorName( 'right' ) +'%c'+
					'\n         |     %c0%c     |  /'+
					'\n         |%c'+ getColorName( 'front', CENTER, 11 ) +'%c| /'+
					'\n         |           |/'+
					'\n          -----------'+
					'\n               %cdown%c'+
					'\n                %c3%c'+
					'\n           %c'+ getColorName( 'down', CENTER, 11 ) +'%c\n',

					this.front.color.styleB, '',
					this.up.color.styleB,    '',
					this.right.color.styleB, '',
					this.down.color.styleB,  '',
					this.left.color.styleB,  '',
					this.back.color.styleB,  '',

					this.back.color.styleF,  '',
					this.up.color.styleF,    '',
					this.back.color.styleF,  '',
					this.up.color.styleF,    '',
					this.back.color.styleF,  '',
					this.up.color.styleF,    '',
					this.left.color.styleF,  '',
					this.right.color.styleF, '',
					this.left.color.styleF,  '',
					this.right.color.styleF, '',
					this.left.color.styleF,  '',
					this.front.color.styleF, '',
					this.right.color.styleF, '',
					this.front.color.styleF, '',
					this.front.color.styleF, '',
					this.down.color.styleF,  '',
					this.down.color.styleF,  '',
					this.down.color.styleF,  ''
				)
			}
		},




		//  Does this Cubelet contain a certain color?
		//  If so, return a String decribing what face that color is on.
		//  Otherwise return false.

		hasColor: function( color ){

			var i, face
			
			for( i = 0; i < 6; i ++ ){

				if( this.faces[ i ].color === color ){
					
					face = i
					break
				}
			}
			if( face !== undefined ){

				return [

					'front',
					'up',
					'right',
					'down',
					'left',
					'back'

				][ face ]
			}
			else return false
		},


		//  Similar to above, but accepts an arbitrary number of colors.
		//  This function implies AND rather than OR, XOR, etc.

		hasColors: function(){

			var 
			cubelet = this,
			result  = true,
			colors  = Array.prototype.slice.call( arguments )
			
			colors.forEach( function( color ){

				result = result && !!cubelet.hasColor( color )
			})
			return result
		},




		//  We can rotate this Cublet on the X, Y, and Z axes
		//  both clockwise and anticlockwise.

		rotate: function( rotation, degrees, cubeCallback ){

			var 
			cubelet = this,
			cube    = this.cube,
			xTarget = 0,
			yTarget = 0,
			zTarget = 0,			
			rotationUpperCase = rotation.toUpperCase(),
			threshold = 0.001


			//  We need to signal to the world that we cannot accept more rotation() commands.
			//  This will also cause all Groups (and Slices) containing this Cubelet
			//  to refuse all twist() commands until further notice.

			this.isTweening = true


			//  Logically rotating our Cubelet is a matter of swapping the order
			//  of the faces in the this.faces Array. The order is interpreted as:
			//  Front, Up, Right, Down, Left, Back.

			if( rotationUpperCase === 'X' ){

				cubelet.isEngagedX = true
				if( rotation === 'X' ) xTarget = degrees
				else xTarget = -degrees
			}
			else if( rotationUpperCase === 'Y' ){

				cubelet.isEngagedY = true
				if( rotation === 'Y' ) yTarget = degrees
				else yTarget = -degrees
			}
			else if( rotationUpperCase === 'Z' ){

				cubelet.isEngagedZ = true
				if( rotation === 'Z' ) zTarget = degrees
				else zTarget = -degrees
			}


			//  At every steps let's try to keep our values tidy.

			this.x += xTarget.round()
			this.y += yTarget.round()
			this.z += zTarget.round()


			//  Our Cube's twistDuration is the amount of time (in miliseconds)
			//  that it should take to rotate 90 dgrees.
			//  We're going to scale that to match whatever number of degrees we're actually rotating:

			var 
			twistDuration = this.cube !== undefined ? this.cube.twistDuration : SECOND,
			twistDurationScaled = [ degrees.absolute().scale( 0, 90, 0, twistDuration ), 250 ].maximum()


			//  And now for the rotation tween itself...
			//  It feels very wrong to me that we're going to invert the coordinate space here
			//  but that's how the cookie crumbles. Sorry. 

			new TWEEN.Tween( this.anchor.rotation )
			.to({

				x: -xTarget.degreesToRadians(),
				y: -yTarget.degreesToRadians(),
				z: -zTarget.degreesToRadians()
			
			}, twistDurationScaled )
			.easing( TWEEN.Easing.Quartic.Out )
			.start()
			.onComplete( function(){


				//  What dark voodoo is this? 
				//  Calling window.render() within a tween onComplete()?
				//  I noticed that when switching between tabs,
				//  or after putting the machine to sleep then waking it,
				//  the tweened bits would be totally f'd
				//  yet their X, Y, Z rotation values were as expected.
				//  Calling window.render() is a dirty way to update 
				//  all of the *matrices* and keeps the world tidy!
				
				render()


				//  We need to reset our anchor's rotation to ( 0, 0, 0 )
				//  so that we never lose our anchor's orientation relative to the cube itself.
				//  First thing to do is apply our anchor's matrix 
				//  to the matrix of our visual wrapper:

				cubelet.wrapper.applyMatrix( cubelet.anchor.matrix )


				//  And now that we've retained that rotation information
				//  we can safely reset the anchor's rotation:

				cubelet.anchor.rotation.set( 0, 0, 0 )


				//  Here's some complexity.
				//  We need to support partial rotations of arbitrary degrees
				//  yet ensure our internal model is always in a valid state.
				//  This means only remapping the Cubelet when it makes sense
				//  and also remapping the Cube if this Cubelet is allowed to do so.

				var 
				xRemaps = cubelet.x.divide( 90 ).round()
					.subtract( cubelet.xPrevious.divide( 90 ).round() )
					.absolute(),
				yRemaps = cubelet.y.divide( 90 ).round()
					.subtract( cubelet.yPrevious.divide( 90 ).round() )
					.absolute(),
				zRemaps = cubelet.z.divide( 90 ).round()
					.subtract( cubelet.zPrevious.divide( 90 ).round() )
					.absolute()

				if( erno.verbosity >= 0.9 ){

					console.log( 'Cublet #'+ ( cubelet.id < 10 ? '0'+ cubelet.id : cubelet.id ), 
						' |  xRemaps:', xRemaps, ' yRemaps:', yRemaps, ' zRemaps:', zRemaps,
						' |  xPrev:', cubelet.xPrevious, ' x:', cubelet.x,
						' |  yPrev:', cubelet.yPrevious, ' y:', cubelet.y,
						' |  zPrev:', cubelet.zPrevious, ' z:', cubelet.z )
				}


				if( xRemaps ){
					
					while( xRemaps -- ){

						if( cubelet.x < cubelet.xPrevious ) cubelet.faces = [ cubelet.up, cubelet.back, cubelet.right, cubelet.front, cubelet.left, cubelet.down ]
						else cubelet.faces = [ cubelet.down, cubelet.front, cubelet.right, cubelet.back, cubelet.left, cubelet.up ]
						cubelet.map()
						if( cubeCallback !== undefined ){

							cubeCallback( cubelet.cube.cubelets.slice())
							cubelet.cube.map()
						}
					}
					cubelet.xPrevious = cubelet.x
				}
				if( cubelet.x.modulo( 90 ).absolute() < threshold ){

					cubelet.x = 0
					cubelet.xPrevious = cubelet.x
					cubelet.isEngagedX = false
				}
				

				if( yRemaps ){
					
					while( yRemaps -- ){

						if( cubelet.y < cubelet.yPrevious ) cubelet.faces = [ cubelet.left, cubelet.up, cubelet.front, cubelet.down, cubelet.back, cubelet.right ]
						else cubelet.faces = [ cubelet.right, cubelet.up, cubelet.back, cubelet.down, cubelet.front, cubelet.left ]
						cubelet.map()
						if( cubeCallback !== undefined ){

							cubeCallback( cubelet.cube.cubelets.slice())
							cubelet.cube.map()
						}
					}
					cubelet.yPrevious = cubelet.y
				}
				if( cubelet.y.modulo( 90 ).absolute() < threshold ){

					cubelet.y = 0
					cubelet.yPrevious = cubelet.y
					cubelet.isEngagedY = false
				}


				if( zRemaps ){
					
					while( zRemaps -- ){

						if( cubelet.z < cubelet.zPrevious ) cubelet.faces = [ cubelet.front, cubelet.right, cubelet.down, cubelet.left, cubelet.up, cubelet.back ]
						else cubelet.faces = [ cubelet.front, cubelet.left, cubelet.up, cubelet.right, cubelet.down, cubelet.back ]
						cubelet.map()
						if( cubeCallback !== undefined ){

							cubeCallback( cubelet.cube.cubelets.slice())
							cubelet.cube.map()
						}
					}
					cubelet.zPrevious = cubelet.z
				}
				if( cubelet.z.modulo( 90 ).absolute() < threshold ){

					cubelet.z = 0
					cubelet.zPrevious = cubelet.z
					cubelet.isEngagedZ = false
				}


				//  Phew! Now we can turn off the tweening flag.

				cubelet.isTweening = false
			})
		},




		//  Visual switches.

		show: function(){

			$( '.cubeletId-'+ this.id ).show()
			this.showing = true
		},
		hide: function(){

			$( '.cubeletId-'+ this.id ).hide()
			this.showing = false
		},
		showPlastics: function(){

			if( erno.renderMode === 'css' ) $( '.cubeletId-'+ this.id +' .face' ).removeClass( 'faceTransparent' )
			else this.plastic.material.opacity = 1
			this.showingPlastics = true
		},
		hidePlastics: function(){

			if( erno.renderMode === 'css' ) $( '.cubeletId-'+ this.id +' .face' ).addClass( 'faceTransparent' )
			else this.plastic.material.opacity = 0
			this.showingPlastics = false
		},
		showExtroverts: function(){

			$( '.cubeletId-'+ this.id + ' .faceExtroverted' ).show()
			this.showingExtroverts = true
		},
		hideExtroverts: function(){

			$( '.cubeletId-'+ this.id + ' .faceExtroverted' ).hide()
			this.showingExtroverts = false
		},
		showIntroverts: function(){

			$( '.cubeletId-'+ this.id + ' .faceIntroverted' ).show()
			this.showingIntroverts = true
		},
		hideIntroverts: function(){

			$( '.cubeletId-'+ this.id + ' .faceIntroverted' ).hide()
			this.showingIntroverts = false
		},
		showStickers: function(){

			if( erno.renderMode === 'css' ) $( '.cubeletId-'+ this.id + ' .sticker' ).show()
			else this.faces.forEach( function( face ){

				if( face.sticker ) face.sticker.material.opacity = 1
			})
			this.showingStickers = true
		},
		hideStickers: function(){

			if( erno.renderMode === 'css' ) $( '.cubeletId-'+ this.id + ' .sticker' ).hide()
			else this.faces.forEach( function( face ){

				if( face.sticker ) face.sticker.material.opacity = 0
			})
			this.showingStickers = false
		},
		showWireframes: function(){

			if( erno.renderMode === 'css' ) $( '.cubeletId-'+ this.id + ' .wireframe' ).show()
			else this.wireframe.material.opacity = 1
			this.showingWireframes = true
		},
		hideWireframes: function(){

			if( erno.renderMode === 'css' ) $( '.cubeletId-'+ this.id + ' .wireframe' ).hide()
			else this.wireframe.material.opacity = 0
			this.showingWireframes = false
		},
		showIds: function(){

			$( '.cubeletId-'+ this.id + ' .id' ).show()
			this.showingIds = true
		},
		hideIds: function(){

			$( '.cubeletId-'+ this.id + ' .id' ).hide()
			this.showingIds = false
		},
		showTexts: function(){

			$( '.cubeletId-'+ this.id + ' .text' ).show()
			this.showingTexts = true
		},
		hideTexts: function(){

			$( '.cubeletId-'+ this.id + ' .text' ).hide()
			this.showingTexts = false
		},




		getOpacity: function(){

			return this.opacity
		},
		setOpacity: function( opacityTarget, onComplete ){

			if( this.opacityTween ) this.opacityTween.stop()
			if( opacityTarget === undefined ) opacityTarget = 1
			if( opacityTarget !== this.opacity ){

				var 
				that = this,
				tweenDuration = ( opacityTarget - this.opacity ).absolute().scale( 0, 1, 0, SECOND )

				this.opacityTween = new TWEEN.Tween({ opacity: this.opacity })
				.to({

					opacity: opacityTarget
				
				}, tweenDuration )
				.easing( TWEEN.Easing.Quadratic.InOut )
				.onUpdate( function(){

					$( '.cubeletId-'+ that.id ).css( 'opacity', this.opacity )
					that.opacity = this.opacity//opacityTarget
				})
				.onComplete( function(){

					if( onComplete instanceof Function ) onComplete()
				})
				.start()
			}
		},
		getStickersOpacity: function( value ){

			return $( '.cubeletId-'+ this.id + ' .sticker' ).css( 'opacity' )
		},
		setStickersOpacity: function( value ){

			if( value === undefined ) value = 0.2
			$( '.cubeletId-'+ this.id + ' .sticker' ).css( 'opacity', value )
		},
		getRadius: function(){

			return this.radius
		},
		setRadius: function( radius, onComplete ){


			//  @@
			//  It's a shame that we can't do this whilst tweening
			//  but it's because the current implementation is altering the actual X, Y, Z
			//  rather than the actual radius. Can fix later.

			//  Current may produce unexpected results while shuffling. For example:
			//    cube.corners.setRadius( 90 )
			//  may cause only 4 corners instead of 6 to setRadius()
			//  because one side is probably engaged in a twist tween.

			if( this.isTweening === false ){
	
				radius = radius || 0
				if( this.radius === undefined ) this.radius = 0
				if( this.radius !== radius ){


					//  Here's some extra cuteness to make the tween's duration
					//  proportional to the distance traveled.

					var tweenDuration = ( this.radius - radius ).absolute().scale( 0, 100, 0, SECOND )


					//  We need a "that = this" in order to set this.radius = radius
					//  from inside the anonymous onComplete() function below. 

					var that = this
					new TWEEN.Tween( this.wrapper.position )
					.to({

						x: this.addressX.multiply( this.size + radius ),
						y: this.addressY.multiply( this.size + radius ),
						z: this.addressZ.multiply( this.size + radius )
					
					}, tweenDuration )
					.easing( TWEEN.Easing.Quartic.Out )	
					.onComplete( function(){

						that.radius = radius
						if( onComplete instanceof Function ) onComplete()
					})
					.start()
				}
			}
		}
	



	})
})