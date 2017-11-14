// *******************************************************
// CS 174a Graphics Example Code
// animation.js - The main file and program start point.  The class definition here describes how to display an Animation and how it will react to key and mouse input.  Right now it has 
// very little in it - you will fill it in with all your shape drawing calls and any extra key / mouse controls.  

// Now go down to display() to see where the sample shapes are drawn, and to see where to fill in your own code.

"use strict"
var canvas, canvas_size, gl = null, g_addrs,
	movement = vec2(),	thrust = vec3(), 	looking = false, prev_time = 0, animate = false, animation_time = 0;
		var gouraud = false, color_normals = false, solid = false;
function CURRENT_BASIS_IS_WORTH_SHOWING(self, model_transform) { self.m_axis.draw( self.basis_id++, self.graphicsState, model_transform, new Material( vec4( .8,.3,.8,1 ), .5, 1, 1, 40, "" ) ); }


// *******************************************************
// IMPORTANT -- In the line below, add the filenames of any new images you want to include for textures!

var texture_filenames_to_load = [ "stars.png", "text.png", "earth.gif" ];

// *******************************************************	
// When the web page's window loads it creates an "Animation" object.  It registers itself as a displayable object to our other class "GL_Context" -- which OpenGL is told to call upon every time a
// draw / keyboard / mouse event happens.

window.onload = function init() {	var anim = new Animation();	}
function Animation()
{
	( function init (self) 
	{
		self.context = new GL_Context( "gl-canvas" );
		self.context.register_display_object( self );
		
		//gl.clearColor( 0, 0, 0, 1 );			// Background color
		//Change
		gl.clearColor( 1, 1, 1, 1 );

		for( var i = 0; i < texture_filenames_to_load.length; i++ )
			initTexture( texture_filenames_to_load[i], true );
		
		self.m_cube = new cube();
		self.m_obj = new shape_from_file( "teapot.obj" )
		self.m_axis = new axis();
		self.m_sphere = new sphere( mat4(), 4 );	
		self.m_fan = new triangle_fan_full( 10, mat4() );
		self.m_strip = new rectangular_strip( 1, mat4() );
		self.m_cylinder = new cylindrical_strip( 10, mat4() );
		
		// 1st parameter is camera matrix.  2nd parameter is the projection:  The matrix that determines how depth is treated.  It projects 3D points onto a plane.
		self.graphicsState = new GraphicsState( translation(0, 0,-40), perspective(45, canvas.width/canvas.height, .1, 1000), 0 );

		gl.uniform1i( g_addrs.GOURAUD_loc, gouraud);		gl.uniform1i( g_addrs.COLOR_NORMALS_loc, color_normals);		gl.uniform1i( g_addrs.SOLID_loc, solid);
		
		self.context.render();	
	} ) ( this );	
	
	canvas.addEventListener('mousemove', function(e)	{		e = e || window.event;		movement = vec2( e.clientX - canvas.width/2, e.clientY - canvas.height/2, 0);	});
}

// *******************************************************	
// init_keys():  Define any extra keyboard shortcuts here
Animation.prototype.init_keys = function()
{
	shortcut.add( "Space", function() { thrust[1] = -1; } );			shortcut.add( "Space", function() { thrust[1] =  0; }, {'type':'keyup'} );
	shortcut.add( "z",     function() { thrust[1] =  1; } );			shortcut.add( "z",     function() { thrust[1] =  0; }, {'type':'keyup'} );
	shortcut.add( "w",     function() { thrust[2] =  1; } );			shortcut.add( "w",     function() { thrust[2] =  0; }, {'type':'keyup'} );
	shortcut.add( "a",     function() { thrust[0] =  1; } );			shortcut.add( "a",     function() { thrust[0] =  0; }, {'type':'keyup'} );
	shortcut.add( "s",     function() { thrust[2] = -1; } );			shortcut.add( "s",     function() { thrust[2] =  0; }, {'type':'keyup'} );
	shortcut.add( "d",     function() { thrust[0] = -1; } );			shortcut.add( "d",     function() { thrust[0] =  0; }, {'type':'keyup'} );
	shortcut.add( "f",     function() { looking = !looking; } );
	shortcut.add( ",",     ( function(self) { return function() { self.graphicsState.camera_transform = mult( rotation( 3, 0, 0,  1 ), self.graphicsState.camera_transform ); }; } ) (this) ) ;
	shortcut.add( ".",     ( function(self) { return function() { self.graphicsState.camera_transform = mult( rotation( 3, 0, 0, -1 ), self.graphicsState.camera_transform ); }; } ) (this) ) ;

	shortcut.add( "r",     ( function(self) { return function() { self.graphicsState.camera_transform = mat4(); }; } ) (this) );
	shortcut.add( "ALT+s", function() { solid = !solid;					gl.uniform1i( g_addrs.SOLID_loc, solid);	
																		gl.uniform4fv( g_addrs.SOLID_COLOR_loc, vec4(Math.random(), Math.random(), Math.random(), 1) );	 } );
	shortcut.add( "ALT+g", function() { gouraud = !gouraud;				gl.uniform1i( g_addrs.GOURAUD_loc, gouraud);	} );
	shortcut.add( "ALT+n", function() { color_normals = !color_normals;	gl.uniform1i( g_addrs.COLOR_NORMALS_loc, color_normals);	} );
	shortcut.add( "ALT+a", function() { animate = !animate; } );
	
	shortcut.add( "p",     ( function(self) { return function() { self.m_axis.basis_selection++; console.log("Selected Basis: " + self.m_axis.basis_selection ); }; } ) (this) );
	shortcut.add( "m",     ( function(self) { return function() { self.m_axis.basis_selection--; console.log("Selected Basis: " + self.m_axis.basis_selection ); }; } ) (this) );	
}

function update_camera( self, animation_delta_time )
	{
		var leeway = 70, border = 50;
		var degrees_per_frame = .0002 * animation_delta_time;
		var meters_per_frame  = .01 * animation_delta_time;
																					// Determine camera rotation movement first
		var movement_plus  = [ movement[0] + leeway, movement[1] + leeway ];		// movement[] is mouse position relative to canvas center; leeway is a tolerance from the center.
		var movement_minus = [ movement[0] - leeway, movement[1] - leeway ];
		var outside_border = false;
		
		for( var i = 0; i < 2; i++ )
			if ( Math.abs( movement[i] ) > canvas_size[i]/2 - border )	outside_border = true;		// Stop steering if we're on the outer edge of the canvas.

		for( var i = 0; looking && outside_border == false && i < 2; i++ )			// Steer according to "movement" vector, but don't start increasing until outside a leeway window from the center.
		{
			var velocity = ( ( movement_minus[i] > 0 && movement_minus[i] ) || ( movement_plus[i] < 0 && movement_plus[i] ) ) * degrees_per_frame;	// Use movement's quantity unless the &&'s zero it out
			self.graphicsState.camera_transform = mult( rotation( velocity, i, 1-i, 0 ), self.graphicsState.camera_transform );			// On X step, rotate around Y axis, and vice versa.
		}
		self.graphicsState.camera_transform = mult( translation( scale_vec( meters_per_frame, thrust ) ), self.graphicsState.camera_transform );		// Now translation movement of camera, applied in local camera coordinate frame
	}

// *******************************************************	
//	draw Tree
Animation.prototype.drawTree = function(tree_transform)
{
	var trunk = new Material( vec4(0.306, 0.2, 0.145, 1), .5, .2, .5, 20);
	//add the movement to treetransform!
	var reset = tree_transform;
	var y = -10;
	tree_transform = mult(tree_transform, translation(0, -9, -5));
		tree_transform = mult(tree_transform, scale(1,2,1));
						this.m_cube.draw(this.graphicsState, tree_transform, trunk);
		tree_transform = mult(tree_transform, scale(1,1/2,1));

	for( var i = 1; i < 8; i++)
	{
		tree_transform = mult(tree_transform, translation(0, 1, 0));
			tree_transform = mult(tree_transform, rotation((10)*Math.sin(this.graphicsState.animation_time/(1000)), 0, 0, 1));
				tree_transform = mult(tree_transform, translation(0, 1, 0) );
					tree_transform = mult(tree_transform, scale(1,2,1));
						this.m_cube.draw(this.graphicsState, tree_transform, trunk);
					tree_transform = mult(tree_transform, scale(1,1/2,1));

	}
	tree_transform = mult(tree_transform, translation(0, 5, 0) );
	tree_transform = mult(tree_transform, scale(4,4,4));
	this.m_sphere.draw(this.graphicsState,tree_transform, new Material(vec4(1,0,0), .5, .2, .5, 20));
}

// *******************************************************	
//	draw Ground
Animation.prototype.drawGround = function(ground_transform)
{
	ground_transform = mult(ground_transform, translation(0, -20, 0))
	ground_transform = mult(ground_transform, scale(200, 20, 100));
	this.m_cube.draw(this.graphicsState, ground_transform,  new Material( vec4( 0,1,0,1 ), .2, .8, .5, 20 ));

}
// *******************************************************	
//	draw Legs
Animation.prototype.drawLegs = function(leg_transform)
{
	var posx = 2;
	var gray = new Material( vec4( .5,.5,.5,1 ), .5, .2, .5, 20 ); 
	//right side
	var reset = leg_transform;
	for (var i = 0; i < 3; i++)
	{ 
		leg_transform = reset;
		leg_transform = mult(leg_transform, translation(posx - i * 2, -2, 1.9));
		leg_transform = mult(leg_transform, rotation(Math.abs(20*Math.sin(this.graphicsState.animation_time/1000)), 1, 0, 0));

		leg_transform = mult(leg_transform, translation(0, -1.5, 0));
		var reset2 = leg_transform;
		leg_transform = mult(leg_transform, scale(1, 3, 0.8));
		this.m_cube.draw(this.graphicsState, leg_transform,  gray);
		//draw the second hinge
		leg_transform = reset2; //undos the scale
		leg_transform = mult(leg_transform, translation(0, -1.5, -0.4));
		leg_transform = mult(leg_transform, rotation(Math.abs(20*Math.sin(this.graphicsState.animation_time/1000)), 1, 0, 0));

		leg_transform = mult(leg_transform, translation(0, -1.5, 0.4));
		leg_transform = mult(leg_transform, scale(1, 3, 0.8));
		this.m_cube.draw(this.graphicsState, leg_transform,  gray);

		//draw the other side
		leg_transform = reset;
		leg_transform = mult(leg_transform, translation(posx - i * 2, -2, -1.9));
		leg_transform = mult(leg_transform, rotation(-1*Math.abs(20*Math.sin(this.graphicsState.animation_time/1000)), 1, 0, 0));

		leg_transform = mult(leg_transform, translation(0, -1.5, 0));
		reset2 = leg_transform;
		leg_transform = mult(leg_transform, scale(1, 3, 0.8));
		this.m_cube.draw(this.graphicsState, leg_transform, gray);
		//draw the second hinge
		leg_transform = reset2; //undos the scale
		leg_transform = mult(leg_transform, translation(0, -1.5, 0.4));
		leg_transform = mult(leg_transform, rotation(-1*Math.abs(20*Math.sin(this.graphicsState.animation_time/1000)), 1, 0, 0));

		leg_transform = mult(leg_transform, translation(0, -1.5, -0.4));
		leg_transform = mult(leg_transform, scale(1, 3, 0.8));
		this.m_cube.draw(this.graphicsState, leg_transform, gray);
	}
}
// *******************************************************	
//	draw Wasp
Animation.prototype.drawWasp = function(wasp_transform)
{
		var stack = [];
		stack.push(wasp_transform);
		var gray = new Material( vec4( .5,.5,.5,1 ), .5, .2, .5, 20 );

		wasp_transform = mult(wasp_transform, scale(8, 4, 3));
		this.m_cube.draw(this.graphicsState, wasp_transform, gray);
		wasp_transform = stack.pop();

		//create the bulb, the butt of the bee location is currently 10/2 = 5 
		stack.push(wasp_transform);
		wasp_transform = mult(wasp_transform, translation(11, 0, 0));
			wasp_transform = mult(wasp_transform, scale(7, 3, 3));
				this.m_sphere.draw(this.graphicsState, wasp_transform, new Material( vec4(1, 1, 0, 1), .5, .2, .5, 20)); //Change: change the color of this bee bulb
		wasp_transform = stack.pop();
		//create the head
		stack.push(wasp_transform);
		wasp_transform = mult(wasp_transform, translation(-6, 0, 0));
			wasp_transform = mult(wasp_transform, scale(2, 2, 2));
				this.m_sphere.draw(this.graphicsState, wasp_transform, new Material( vec4(0, 0, 1, 1), .5, .2, .5, 20)); //Change: change the color of this bee bulb
		wasp_transform = stack.pop();

		//make separate function for the wings
		//create the left wing
		stack.push(wasp_transform);
		wasp_transform = mult(wasp_transform, translation(0, 2, 1.5));
			wasp_transform = mult(wasp_transform, rotation(20*Math.sin(this.graphicsState.animation_time/1000), 1, 0, 0));
					wasp_transform = mult(wasp_transform, translation(0, 0.4, 4));
						wasp_transform = mult(wasp_transform, scale(3, 0.8, 8));
				this.m_cube.draw(this.graphicsState, wasp_transform, gray); //Change: change the color of this bee bulb
		wasp_transform = stack.pop();
		//create the right wing
		stack.push(wasp_transform);
		wasp_transform = mult(wasp_transform, translation(0, 2, -1.5));
			wasp_transform = mult(wasp_transform, rotation(-1* 20*Math.sin(this.graphicsState.animation_time/1000), 1, 0, 0));
					wasp_transform = mult(wasp_transform, translation(0, 0.4, -4));
						wasp_transform = mult(wasp_transform, scale(3, 0.8, 8));
				this.m_cube.draw(this.graphicsState, wasp_transform, gray); //Change: change the color of this bee bulb
		wasp_transform = stack.pop();
		//create the feet
		this.drawLegs(wasp_transform);
}

// *******************************************************	
// display(): called once per frame, whenever OpenGL decides it's time to redraw.

Animation.prototype.display = function(time)
	{
		if(!time) time = 0;
		this.animation_delta_time = time - prev_time;
		if(animate) this.graphicsState.animation_time += this.animation_delta_time;
		prev_time = time;
		
		update_camera( this, this.animation_delta_time );
			
		this.basis_id = 0;
		
		var model_transform = mat4();
		
		// Materials: Declare new ones as needed in every function.
		// 1st parameter:  Color (4 floats in RGBA format), 2nd: Ambient light, 3rd: Diffuse reflectivity, 4th: Specular reflectivity, 5th: Smoothness exponent, 6th: Texture image.
		var purplePlastic = new Material( vec4( .9,.5,.9,1 ), .2, .5, .8, 40 ), // Omit the final (string) parameter if you want no texture
			greyPlastic = new Material( vec4( .5,.5,.5,1 ), .2, .8, .5, 20 ),
			earth = new Material( vec4( .5,.5,.5,1 ), .5, 1, .5, 40, "earth.gif" ),
			stars = new Material( vec4( .5,.5,.5,1 ), .5, 1, 1, 40, "stars.png" );
			
		/**********************************
		Start coding here!!!!
		**********************************/
		this.m_cube.draw(this.graphicsState, model_transform, new Material( vec4(1, 1, 0, 1), .5, .2, .5, 20) );

				model_transform = mult(model_transform, scale(1,2,1));
				model_transform = mult(model_transform, translation(0,1,0));


		this.m_cube.draw(this.graphicsState, model_transform, new Material( vec4(1, 1, 0, 1), .5, .2, .5, 20) );

	//	model_transform = mult(model_transform, translation(0, 1, 0));
		//this.m_cube.draw(this.graphicsState, model_transform, new Material( vec4(1, 1, 0, 1), .5, .2, .5, 20) );
	//	model_transform = mult(model_transform, translation(0, 3, 0));
	//	model_transform = mult(model_transform, rotation(-45,0, 0,1));
	//	model_transform = mult(model_transform, scale(1,-1,1));
	//	model_transform = mult(model_transform, translation(-1, 0, 0));
	//	model_transform = mult(model_transform, scale(2, 1, 1 ,1));

	//	this.m_cube.draw(this.graphicsState, model_transform, new Material( vec4(1, 1, 0, 1), .5, .2, .5, 20) );


	}	



Animation.prototype.update_strings = function( debug_screen_strings )		// Strings this particular class contributes to the UI
{
	debug_screen_strings.string_map["time"] = "Animation Time: " + this.graphicsState.animation_time/1000 + "s";
	debug_screen_strings.string_map["basis"] = "Showing basis: " + this.m_axis.basis_selection;
	debug_screen_strings.string_map["animate"] = "Animation " + (animate ? "on" : "off") ;
	debug_screen_strings.string_map["thrust"] = "Thrust: " + thrust;
}