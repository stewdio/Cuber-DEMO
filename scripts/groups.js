/*


	GROUPS

	Groups are collections of an arbitrary number of Cubelets.
	They have no concept of Cubelet location or orientation
	and therefore are not capable of rotation around any axis.


*/








function Group(){

	this.cubelets = []
	this.add( Array.prototype.slice.call( arguments ))
}




setupTasks = window.setupTasks || []
setupTasks.push( function(){

	augment( Group, {

		inspect: function( face ){

			this.cubelets.forEach( function( cubelet ){

				cubelet.inspect( face )
			})
			return this
		},
		add: function(){

			var 
			cubeletsToAdd = Array.prototype.slice.call( arguments ),
			that = this

			cubeletsToAdd.forEach( function( cubelet ){

				if( cubelet instanceof Group ) cubelet = cubelet.cubelets
				if( cubelet instanceof Array ) that.add.apply( that, cubelet )
				else that.cubelets.push( cubelet )
			})
			return this
		},
		remove: function( cubeletToRemove ){

			if( cubeletToRemove instanceof Group ) cubeletToRemove = cubeletToRemove.cubelets
			if( cubeletToRemove instanceof Array ){

				var that = this
				cubeletToRemove.forEach( function( c ){

					that.remove( c )
				})
			}
			for( var i = this.cubelets.length - 1; i >= 0; i -- ){

				if( this.cubelets[ i ] === cubeletToRemove )
					this.cubelets.splice( i, 1 )
			}
			return this
		},




		//  Boolean checker.
		//  Are any Cubelets in this group tweening?
		//  Engaged on the Z axis? Etc.

		isFlagged: function( property ){

			var count = 0
			this.cubelets.forEach( function( cubelet ){

				count += cubelet[ property ] ? 1 : 0
			})
			return count
		},
		isTweening: function(){

			return this.isFlagged( 'isTweening' )
		},
		isEngagedX: function(){

			return this.isFlagged( 'isEngagedX' )
		},
		isEngagedY: function(){

			return this.isFlagged( 'isEngagedY' )
		},
		isEngagedZ: function(){

			return this.isFlagged( 'isEngagedZ' )
		},
		isEngaged: function(){

			return this.isEngagedX() + this.isEngagedY() + this.isEngagedZ()
		},




		//  Search functions.
		//  What Cubelets in this Group have a particular color?
		//  How about all of these three colors?
		//  And index? address? Solver uses these a lot.

		hasProperty: function( property, value ){

			var
			results = new Group()

			this.cubelets.forEach( function( cubelet ){

				if( cubelet[ property ] === value ) results.add( cubelet )
			})
			return results
		},
		hasId: function( id ){

			return this.hasProperty( 'id', id ).cubelets[ 0 ]//  expecting a single return!
		},
		hasAddress: function( address ){

			return this.hasProperty( 'address', address ).cubelets[ 0 ]//  expecting a single return!
		},
		hasType: function( type ){

			return this.hasProperty( 'type', type )
		},
		hasColor: function( color ){

			var
			results = new Group()

			this.cubelets.forEach( function( cubelet ){

				if( cubelet.hasColor( color )) results.add( cubelet )
			})
			return results
		},
		hasColors: function(){//  this function implies AND rather than OR, XOR, etc.

			var
			results = new Group(),
			colors  = Array.prototype.slice.call( arguments )

			this.cubelets.forEach( function( cubelet ){

				if( cubelet.hasColors.apply( cubelet, colors )) results.add( cubelet )
			})
			return results
		},




		//  We needed this business in order to deal with partial rotations.
		//  A little janky perhaps (grabbing the average, that is)
		//  but gets the job done and allows us to do getDistanceToPeg() below.

		getAverageRotation: function( axis ){

			var	sum  = 0

			this.cubelets.forEach( function( cubelet ){

				sum += cubelet[ axis.toLowerCase() ]
			})
			return sum / this.cubelets.length
		},
		getAverageRotationX: function(){

			return this.getAverageRotation( 'x' )
		},
		getAverageRotationY: function(){

			return this.getAverageRotation( 'y' )
		},
		getAverageRotationZ: function(){

			return this.getAverageRotation( 'z' )
		},




		//  What rotation degree are we on right now?
		//  What direction are we spinning from here? (Clockwise or anti?)
		//  Let's go in that direction until we hit degree % 90 === 0.
		//  What's the distance from here to there?
		//  Not the prettiest code I've ever written... Sorry.

		getDistanceToPeg: function( axis ){

			var
			current   = this.getAverageRotation( axis ),
			direction = axis.toUpperCase() === axis ? 'clockwise' : 'anticlockwise',
			distance  = current
				.add( 90 )
				.divide( 90 )
				.roundDown()
				.multiply( 90 )
				.subtract( current ),
			target = current + distance

			if( direction === 'anticlockwise' ){

				distance -= 90
				if( distance === 0 ) distance -= 90
				target = current + distance
			}
			if( erno.verbosity >= 0.9 ) console.log( 

				'Average rotation for this group about the '+ axis.toUpperCase() +' axis:', current, 
				'\nRotation direction:', direction,
				'\nDistance to next peg:', distance, 
				'\nTarget rotation:', target
			)


			//  We need to return the absolute() value of the distance
			//  because the vector (direction) of the twist will be taken into account
			//  by cube.twist() or whatever else is calling this function.

			return distance.absolute()
		},




		//  cube.front.isSolved( 'front' )
		//  cube.front.up.isSolved( 'up' )

		isSolved: function( face ){

			if( face ){

				var
				faceColors = {},
				numberOfColors = 0

				if( face instanceof Direction ) face = face.name
				this.cubelets.forEach( function( cubelet ){

					var color = cubelet[ face ].color.name
					if( faceColors[ color ] === undefined ){
						
						faceColors[ color ] = 1
						numberOfColors ++
					}
					else faceColors[ color ] ++
				})
				return numberOfColors === 1 ? true : false
			}
			else {
			
				console.warn( 'A face [String or Direction] argument must be specified when using Group.isSolved().' )
				return false
			}
		},




		//  Visual switches.
		//  Take this group and hide all the stickers,
		//  turn on wireframe mode, etc.

		show: function(){

			this.cubelets.forEach( function( cubelet ){ cubelet.show() })
			return this
		},
		hide: function(){

			this.cubelets.forEach( function( cubelet ){ cubelet.hide() })
			return this
		},
		showPlastics: function(){

			this.cubelets.forEach( function( cubelet ){ cubelet.showPlastics() })
			return this
		},
		hidePlastics: function(){

			this.cubelets.forEach( function( cubelet ){ cubelet.hidePlastics() })
			return this
		},
		showExtroverts: function(){

			this.cubelets.forEach( function( cubelet ){ cubelet.showExtroverts() })
			return this
		},
		hideExtroverts: function(){

			this.cubelets.forEach( function( cubelet ){ cubelet.hideExtroverts() })
			return this
		},
		showIntroverts: function(){

			this.cubelets.forEach( function( cubelet ){ cubelet.showIntroverts() })
			return this
		},
		hideIntroverts: function(){

			this.cubelets.forEach( function( cubelet ){ cubelet.hideIntroverts() })
			return this
		},		
		showStickers: function(){

			this.cubelets.forEach( function( cubelet ){ cubelet.showStickers() })
			return this
		},
		hideStickers: function(){

			this.cubelets.forEach( function( cubelet ){ cubelet.hideStickers() })
			return this
		},
		showWireframes: function(){

			this.cubelets.forEach( function( cubelet ){ cubelet.showWireframes() })
			return this
		},
		hideWireframes: function(){

			this.cubelets.forEach( function( cubelet ){ cubelet.hideWireframes() })
			return this
		},
		showIds: function(){

			this.cubelets.forEach( function( cubelet ){ cubelet.showIds() })
			return this
		},
		hideIds: function(){

			this.cubelets.forEach( function( cubelet ){ cubelet.hideIds() })
			return this
		},
		showTexts: function(){

			this.cubelets.forEach( function( cubelet ){ cubelet.showTexts() })
			return this
		},
		hideTexts: function(){

			this.cubelets.forEach( function( cubelet ){ cubelet.hideTexts() })
			return this
		},




		getOpacity: function(){

			var avg = 0

			this.cubelets.forEach( function( cubelet ){ avg += cubelet.getOpacity() })
			return avg / this.cubelets.length
		},
		setOpacity: function( opacity, onComplete ){

			this.cubelets.forEach( function( cubelet ){ cubelet.setOpacity( opacity, onComplete ) })
			return this
		},
		getRadius: function(){

			var avg = 0

			this.cubelets.forEach( function( cubelet ){ avg += cubelet.getRadius() })
			return avg / this.cubelets.length
		},
		setRadius: function( radius, onComplete ){

			this.cubelets.forEach( function( cubelet ){ cubelet.setRadius( radius, onComplete ) })
			return this
		}




	})
})