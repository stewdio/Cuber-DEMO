/*


	SLICES

	Slices are thin layers sliced out of the Cube
	composed of 9 Cubelets (3x3 grid).
	The position of these Cubelets can be mapped as follows:


       ----------- ----------- ----------- 
      |           |           |           |
      | northWest |   north   | northEast |
      |     0     |     1     |     2     |
      |           |           |           |
       ----------- ----------- ----------- 
      |           |           |           |
      |    west   |   origin  |    east   |
      |     3     |     4     |     5     |
      |           |           |           |
       ----------- ----------- ----------- 
      |           |           |           |
      | southWest |   south   | southEast |
      |     6     |     7     |     8     |
      |           |           |           |
       ----------- ----------- ----------- 



	The cubelets[] Array is mapped to names for convenience:

	  this.cubelets[ 0 ] === this.northWest
	  this.cubelets[ 1 ] === this.north
	  this.cubelets[ 2 ] === this.northEast
	  this.cubelets[ 3 ] === this.west
	  this.cubelets[ 4 ] === this.origin
	  this.cubelets[ 5 ] === this.east
	  this.cubelets[ 6 ] === this.southWest
	  this.cubelets[ 7 ] === this.south
	  this.cubelets[ 8 ] === this.southEast	



	Portions of Slices can be Grouped:

	Rows and columns as strips (1x3)
	  this.up
	  this.equator
	  this.down
	  this.left
	  this.middle
	  this.right

	Other combinations
	  this.cross
	  this.edges
	  this.ex
	  this.corners
	  this.ring
	  this.dexter
	  this.sinister



	A Slice may be inspected from the browser's JavaScript console with: 

	  this.inspect() 

	This will reveal the Slice's Cubelets, their Indexes, and colors. 
	A compact inspection mode is also available:

	  this.inspect( true )

	This is most useful for Slices that are also Faces. For Slices that are
	not Faces, or for special cases, it may be useful to send a side
	argument which is usually by default the Slice's origin's only visible
	side if it has one. 

	  this.inspect( false, 'up' )
	  this.inspect( true, 'up' )



	CUBE FACES vs CUBE SLICES

	All Cube faces are Slices, but not all Slices are Cube faces. 
	For example, a Cube has 6 faces: front, up, right, down, left, back. 
	But it also has slices that that cut through the center of the Cube 
	itself: equator, middle, and standing. When a Slice maps itself it 
	inspects the faces of the Cubelet in the origin position of the Slice -- 
	the center piece -- which can either have a single visible face or no 
	visible face. If it has a visible face then the Slice's face and the 
	face's direction is in the direction of that Cubelet's visible face. 
	This seems redundant from the Cube's perspective:

	  cube.front.face === 'front'

	However it becomes valuable from inside a Slice or Fold when a 
	relationship to the Cube's orientation is not immediately clear:

	  if( this.face === 'front' )...

	Therefore a Slice (s) is also a face if s.face !== undefined.




*/








function Slice(){

	this.cubelets = Array.prototype.slice.call( arguments )
	this.map()
}




setupTasks = window.setupTasks || []
setupTasks.push( function(){

	augment( Slice, {

	
		inspect: function( compact, side ){

			var
			getColorName = function( cubelet ){

				return cubelet[ side ].color.name.toUpperCase().justifyCenter( 9 )
			},
			sideLabel = ''

			if( side === undefined ){

 				if( this.face !== undefined ) side = this.face
				else side = 'front'
			}
			if( side instanceof Direction ) side = side.name
			if( side !== this.face ) sideLabel = side + 's'
			if( compact ){

				console.log(

					'\n' + this.name.capitalize().justifyLeft( 10 ) +
					'%c '+ this.northWest.id.toPaddedString( 2 ) +' %c '+
					'%c '+ this.north.id.toPaddedString( 2 ) +' %c '+
					'%c '+ this.northEast.id.toPaddedString( 2 ) +' %c '+
					'\n' + sideLabel +'\n'+

					'          %c '+ this.west.id.toPaddedString( 2 ) +' %c '+
					'%c '+ this.origin.id.toPaddedString( 2 ) +' %c '+
					'%c '+ this.east.id.toPaddedString( 2 ) +' %c '+
					'\n\n'+
					'          %c '+ this.southWest.id.toPaddedString( 2 ) +' %c '+
					'%c '+ this.south.id.toPaddedString( 2 ) +' %c '+
					'%c '+ this.southEast.id.toPaddedString( 2 ) +' %c '+
					'\n',

					this.northWest[ side ].color.styleB, '',
					this.north[     side ].color.styleB, '',
					this.northEast[ side ].color.styleB, '',
					
					this.west[      side ].color.styleB, '',
					this.origin[    side ].color.styleB, '',
					this.east[      side ].color.styleB, '',
					
					this.southWest[ side ].color.styleB, '',
					this.south[     side ].color.styleB, '',
					this.southEast[ side ].color.styleB, ''
				)
			}
			else {

				console.log(

					'\n          %c           %c %c           %c %c           %c '+
					'\n'+ this.name.capitalize().justifyLeft( 10 ) +
					'%c northWest %c '+
					'%c   north   %c '+
					'%c northEast %c '+
					'\n' + sideLabel.justifyLeft( 10 ) +
					'%c '+ this.northWest.id.toPaddedString( 2 ).justifyCenter( 9 ) +' %c '+
					'%c '+ this.north.id.toPaddedString( 2 ).justifyCenter( 9 ) +' %c '+
					'%c '+ this.northEast.id.toPaddedString( 2 ).justifyCenter( 9 ) +' %c '+
					'\n' +
					'          %c ' + getColorName( this.northWest ) +' %c '+
					'%c '+ getColorName( this.north ) +' %c '+
					'%c '+ getColorName( this.northEast ) +' %c '+
					'\n          %c           %c %c           %c %c           %c '+


					'\n\n          %c           %c %c           %c %c           %c '+
					'\n          %c    west   %c '+
					'%c   origin  %c '+
					'%c    east   %c '+
					'\n' +
					'          %c ' + this.west.id.toPaddedString( 2 ).justifyCenter( 9 ) +' %c '+
					'%c '+ this.origin.id.toPaddedString( 2 ).justifyCenter( 9 ) +' %c '+
					'%c '+ this.east.id.toPaddedString( 2 ).justifyCenter( 9 ) +' %c '+
					'\n' +
					'          %c ' + getColorName( this.west ) +' %c '+
					'%c '+ getColorName( this.origin ) +' %c '+
					'%c '+ getColorName( this.east ) +' %c '+
					'\n          %c           %c %c           %c %c           %c '+


					'\n\n          %c           %c %c           %c %c           %c '+
					'\n          %c southWest %c '+
					'%c   south   %c '+
					'%c southEast %c '+
					'\n' +
					'          %c ' + this.southWest.id.toPaddedString( 2 ).justifyCenter( 9 ) +' %c '+
					'%c '+ this.south.id.toPaddedString( 2 ).justifyCenter( 9 ) +' %c '+
					'%c '+ this.southEast.id.toPaddedString( 2 ).justifyCenter( 9 ) +' %c '+
					'\n' +
					'          %c ' + getColorName( this.southWest ) +' %c '+
					'%c '+ getColorName( this.south ) +' %c '+
					'%c '+ getColorName( this.southEast ) +' %c '+
					'\n          %c           %c %c           %c %c           %c\n',


					this.northWest[ side ].color.styleB, '',
					this.north[     side ].color.styleB, '',
					this.northEast[ side ].color.styleB, '',
					this.northWest[ side ].color.styleB, '',
					this.north[     side ].color.styleB, '',
					this.northEast[ side ].color.styleB, '',
					this.northWest[ side ].color.styleB, '',
					this.north[     side ].color.styleB, '',
					this.northEast[ side ].color.styleB, '',
					this.northWest[ side ].color.styleB, '',
					this.north[     side ].color.styleB, '',
					this.northEast[ side ].color.styleB, '',
					this.northWest[ side ].color.styleB, '',
					this.north[     side ].color.styleB, '',
					this.northEast[ side ].color.styleB, '',
					
					this.west[      side ].color.styleB, '',
					this.origin[    side ].color.styleB, '',
					this.east[      side ].color.styleB, '',
					this.west[      side ].color.styleB, '',
					this.origin[    side ].color.styleB, '',
					this.east[      side ].color.styleB, '',
					this.west[      side ].color.styleB, '',
					this.origin[    side ].color.styleB, '',
					this.east[      side ].color.styleB, '',
					this.west[      side ].color.styleB, '',
					this.origin[    side ].color.styleB, '',
					this.east[      side ].color.styleB, '',
					this.west[      side ].color.styleB, '',
					this.origin[    side ].color.styleB, '',
					this.east[      side ].color.styleB, '',
					
					this.southWest[ side ].color.styleB, '',
					this.south[     side ].color.styleB, '',
					this.southEast[ side ].color.styleB, '',
					this.southWest[ side ].color.styleB, '',
					this.south[     side ].color.styleB, '',
					this.southEast[ side ].color.styleB, '',
					this.southWest[ side ].color.styleB, '',
					this.south[     side ].color.styleB, '',
					this.southEast[ side ].color.styleB, '',
					this.southWest[ side ].color.styleB, '',
					this.south[     side ].color.styleB, '',
					this.southEast[ side ].color.styleB, '',
					this.southWest[ side ].color.styleB, '',
					this.south[     side ].color.styleB, '',
					this.southEast[ side ].color.styleB, ''
				)
			}
		},
		map: function(){


			//  Addressing single Cubelets can best be done by 
			//  compass notation.

			this.origin    = this.cubelets[ 4 ]
			this.north     = this.cubelets[ 1 ]
			this.northEast = this.cubelets[ 2 ]
			this.east      = this.cubelets[ 5 ]
			this.southEast = this.cubelets[ 8 ]
			this.south     = this.cubelets[ 7 ]
			this.southWest = this.cubelets[ 6 ]
			this.west      = this.cubelets[ 3 ]
			this.northWest = this.cubelets[ 0 ]


			//  Now that we know what the origin Cubelet is 
			//  we can determine if this is merely a Slice
			//  or if it is also a Face.
			//  If a face we'll know what direction it faces
			//  and what the color of the face *should* be. 

			for( var i = 0; i < 6; i ++ ){

				if( this.origin.faces[ i ].color && this.origin.faces[ i ].color !== COLORLESS ){

					this.color = this.origin.faces[ i ].color
					this.face = Direction.getNameById( i )
					break
				}
			}

			
			//  Addressing orthagonal strips of Cubelets is more easily done by
			//  cube notation for the X and Y axes.
		
			this.up = new Group(

				this.northWest, this.north, this.northEast
			)
			this.equator = new Group(

				this.west, this.origin, this.east
			)
			this.down = new Group(

				this.southWest, this.south, this.southEast
			)
			this.left = new Group(

				this.northWest,
				this.west,
				this.southWest
			)
			this.middle = new Group(

				this.north,
				this.origin,
				this.south
			)
			this.right = new Group(

				this.northEast,
				this.east,
				this.southEast
			)


			//  If our Slice has only one center piece 
			// (ie. a Cubelet with only ONE single Sticker)
			//  then it is a Face -- a special kind of Slice.

			var hasCenter = this.hasType( 'center' )
			if( hasCenter && hasCenter.cubelets.length === 1 ){

				this.center  = this.hasType( 'center' )//.cubelets[ 0 ]
				this.corners = new Group( this.hasType( 'corner' ))
				this.cross   = new Group( this.center, this.hasType( 'edge' ))				
				this.ex      = new Group( this.center, this.hasType( 'corner' ))
			}


			//  Otherwise our Slice will have multiple center pieces
			// (again, that means Cubelets with only ONE single Sticker)
			//  and this is why a Slice's "origin" is NOT the same as
			//  its "center" or "centers!"

			else {

				this.centers = new Group( this.hasType( 'center' ))
			}
			this.edges = new Group( this.hasType( 'edge' ))			


			//  I'm still debating whether this should be Sticker-related
			//  or if it's merely a fun grouping. 
			//  Writing the solver should clarify this further...

			this.ring = new Group(

				this.northWest, this.north, this.northEast,
				this.west, this.east,
				this.southWest, this.south, this.southEast
			)


			//  And finally for the hell of it let's try diagonals via
			//  Blazon notation:

			this.dexter = new Group(//  From top-left to bottom-right.

				this.northWest,
				this.origin,
				this.southEast
			)
			this.sinister = new Group(//  From top-right to bottom-left.

				this.northEast,
				this.origin,
				this.southWest
			)
		},




		//  Given a Cubelet in this Slice,
		//  what is its compass location?

		getLocation: function( cubelet ){

			if( cubelet === this.origin    ) return 'origin'
			if( cubelet === this.north     ) return 'north'
			if( cubelet === this.northEast ) return 'northEast'
			if( cubelet === this.east      ) return 'east'
			if( cubelet === this.southEast ) return 'southEast'
			if( cubelet === this.south     ) return 'south'
			if( cubelet === this.southWest ) return 'southWest'
			if( cubelet === this.west      ) return 'west'
			if( cubelet === this.northWest ) return 'northWest'

			return false
		}




	})


	//  We want Slice to learn from Group
	//  but we don't want their prototypes to actually be linked.
	//  Hence we use Skip.js's learn function:

	learn( Slice.prototype, Group.prototype )
})



