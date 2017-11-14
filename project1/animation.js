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

var texture_filenames_to_load = [ "stars.png", "text.png", "earth.gif", "build1.png", "modern.png", "build3.png", "floor.png", "STOP.png", "sky.png" ];

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
		self.m_obj = new shape_from_file( "teapot.obj" );
		self.m_axis = new axis();
		self.m_sphere = new sphere( mat4(), 4 );	
		self.m_fan = new triangle_fan_full( 10, mat4() );
		self.m_strip = new rectangular_strip( 1, mat4() );
		self.m_cylinder = new cylindrical_strip( 10, mat4() );
		self.m_petronas = new shape_from_file( "petronas.obj" );
		self.m_triangle = new triangle();
		self.m_octagon = new octagon();
		self.m_tetrahedron = new tetrahedron();
		self.m_car = new carShape();
		self.m_circle = new circle();

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

	shortcut.add( "Down",     function() { thrust[1] =  8; } );			shortcut.add( "Down",     function() { thrust[1] =  0; }, {'type':'keyup'} );
	shortcut.add( "Left",     function() { thrust[0] =  8; } );			shortcut.add( "Left",     function() { thrust[0] =  0; }, {'type':'keyup'} );
	shortcut.add( "Right",     function() { thrust[0] = -8; } );			shortcut.add( "Right",     function() { thrust[0] =  0; }, {'type':'keyup'} );
	shortcut.add( "Up", function() { thrust[1] = -8; } );			shortcut.add( "Up", function() { thrust[1] =  0; }, {'type':'keyup'} );
	shortcut.add( "1",     function() { thrust[2] =  8; } );			shortcut.add( "1",     function() { thrust[2] =  0; }, {'type':'keyup'} );
	shortcut.add( "2",     function() { thrust[2] = -8; } );			shortcut.add( "2",     function() { thrust[2] =  0; }, {'type':'keyup'} );


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
//	draw building1
Animation.prototype.drawBuilding1 = function(model_transform)
{
		var building1 = new Material( vec4( .5,.5,.5,1 ), .2, .5, .5, 40, "build1.png" )

		var reset = model_transform;
		//model_transform = mult(model_transform, translation(5, -80, -50)); //top
		model_transform =mult(model_transform, scale(1/2, 1/2, 1/2));
		model_transform =mult(model_transform, translation(0, 100, 0));

		model_transform = mult(model_transform, scale(40,200,40)); //lower block has y length 200
			this.m_cube.draw(this.graphicsState, model_transform, building1);
		model_transform = mult(model_transform, scale(1/40, 1/200, 1/40));
		
		model_transform = mult(model_transform, translation(0, 100+5, 0)); //based on lower block + upper block
			model_transform = mult(model_transform, scale(30, 10, 30)); //upper block has y length 10
				this.m_cube.draw(this.graphicsState, model_transform, building1);
			model_transform = mult(model_transform, scale(1/30, 1/10, 1/30));
		
		//for drawing the cone
		reset = model_transform;
			//figure out how to put this into a loop..
				model_transform = mult(model_transform, translation(-11, 5+6, 11));
					model_transform = mult(model_transform, rotation(90, 0, 1, 0));
						model_transform = mult(model_transform, rotation(90, 1, 0, 0)); //x points in negative z (back), z points up (up), y points in -x   (left)
							model_transform = mult(model_transform, scale(1.5, 1.5, 12));
								this.m_cylinder.draw( this.graphicsState, model_transform, new Material( vec4( .76,.76,.76,1 ), .5, 1, .5, 40));
							model_transform = mult(model_transform, scale(1/1.5, 1/1.5, 1/12));
							//adding a cone at the top
								model_transform = mult(model_transform, translation(0, 0, 6));
									model_transform = mult(model_transform, scale(1.5, 1.5, 1.5));
										this.m_cube.draw(this.graphicsState, model_transform, new Material( vec4( .76,.76,.76,1 ), .5, 1, .5, 40));
									model_transform = mult(model_transform, scale(1/1.5, 1/1.5, 1/1.5));
								model_transform = mult(model_transform, translation(0, 0, -6));


								//back left cylinder
								model_transform = mult(model_transform, translation(11+11, 0, 0));
									model_transform = mult(model_transform, scale(1.5, 1.5, 12));
										this.m_cylinder.draw( this.graphicsState, model_transform, new Material( vec4(  .76,.76,.76,1), .5, 1, .5, 40));
									model_transform = mult(model_transform, scale(1/1.5, 1/1.5, 1/12));
								//back right cylinder
								model_transform = mult(model_transform, translation(0, 11+11, 0));
									model_transform = mult(model_transform, scale(1.5, 1.5, 12));									
										this.m_cylinder.draw( this.graphicsState, model_transform, new Material( vec4(  .76,.76,.76,1 ), .5, 1, .5, 40));
									model_transform = mult(model_transform, scale(1/1.5, 1/1.5, 1/12));
								//front right cylinder
								model_transform = mult(model_transform, translation(-11-11, 0, 0));
									model_transform = mult(model_transform, scale(1.5, 1.5, 12));									
										this.m_cylinder.draw( this.graphicsState, model_transform, new Material( vec4(  .76,.76,.76,1 ), .5, 1, .5, 40));
			model_transform = reset; //proper axes
				model_transform = mult(model_transform, translation(0,5+15+6,0));
					model_transform = mult(model_transform, scale(15, 15, 15));
						model_transform = mult(model_transform, rotation(90, 0, 1, 0));
							model_transform = mult(model_transform, rotation(-90, 1, 0, 0));

				this.m_fan.draw(this.graphicsState, model_transform, new Material( vec4(  .76,.76,.76,1 ), .5, 1, .5, 40));
}
Animation.prototype.drawBuilding2 = function(model_transform)
{
	var build2 = new Material( vec4( .5,.5,.5,1 ), .5, 1, 1, 40, "modern.png" );
		model_transform =mult(model_transform, translation(0, 85, 0));
		model_transform = mult(model_transform, scale(50, 170, 40)); //upper block has y length 10
			this.m_cube.draw(this.graphicsState, model_transform, build2);	
		model_transform = mult(model_transform, scale(1/50, 1/170, 1/40)); //upper block has y length 10
}
// *******************************************************	
// display(): called once per frame, whenever OpenGL decides it's time to redraw.

Animation.prototype.drawLamp = function(model_transform)
{
		var trafficPlastic = new Material( vec4( 64/288,64/288,64/288,1 ), .2, .8, .5, 20 ), yellowPlastic = new Material( vec4( 255/288,255/288,0,1 ), .2, .8, 0, 20 );

		model_transform = mult(model_transform, rotation(90, 1,0,0));
			model_transform = mult(model_transform, scale(0.5,0.5,14));
				this.m_cylinder.draw(this.graphicsState, model_transform, trafficPlastic);	
			model_transform = mult(model_transform, scale(1/0.5, 1/0.5, 1/14));
 		model_transform = mult(model_transform, translation(1.5, 0, -7));
 			model_transform = mult(model_transform, rotation(-80, 0,1,0));
 				model_transform = mult(model_transform, scale(0.5, 0.5, 4));
					this.m_cylinder.draw(this.graphicsState, model_transform, trafficPlastic);	
				 model_transform = mult(model_transform, scale(1/0.5, 1/0.5, 1/4));
			 model_transform = mult(model_transform, rotation(80, 0,1,0));
		model_transform = mult(model_transform, translation(1.6, 0, 0.2));
			model_transform = mult(model_transform, rotation(180, 1,0,0));
				this.m_fan.draw(this.graphicsState, model_transform, trafficPlastic);
				model_transform = mult(model_transform, translation(0, 0, -0.9));

				 model_transform = mult(model_transform, scale(0.5, 0.5, 0.5));
				this.m_sphere.draw(this.graphicsState, model_transform, yellowPlastic);
}

Animation.prototype.drawSimpleSign = function(model_transform, material)
{
	model_transform = mult(model_transform, translation(0, 7, 0));
	model_transform = mult(model_transform, scale(15,5,0.5));
		this.m_cube.draw(this.graphicsState, model_transform, material);
	model_transform = mult(model_transform, scale(1/15,1/5,1/0.5));
	
	model_transform = mult(model_transform, translation(0, -7, 0));
		model_transform = mult(model_transform, translation(-8, 5, 0));
		model_transform = mult(model_transform, rotation(90, 1,0,0));
			model_transform = mult(model_transform, scale(0.5,0.5,10));
				this.m_cylinder.draw(this.graphicsState, model_transform, material);	
			model_transform = mult(model_transform, scale(1/0.5,1/0.5,1/10));
		model_transform = mult(model_transform, rotation(-90, 1,0,0));
			model_transform = mult(model_transform, translation(16, 0, 0));
		model_transform = mult(model_transform, rotation(90, 1,0,0));
			model_transform = mult(model_transform, scale(0.5,0.5,10));
				this.m_cylinder.draw(this.graphicsState, model_transform, material);	
}

Animation.prototype.drawTrafficLight = function(model_transform)
{
	var yellowPlastic = new Material( vec4( 255/288,255/288,0,1 ), .2, .8, 0, 20 ),
		redPlastic = new Material( vec4( 255/288,0,0,1 ), .2, .8, .5, 20 ),
		greenPlastic = new Material( vec4( 0,204/288,0,1 ), .2, .8, .5, 20 ),
		trafficPlastic = new Material( vec4( 64/288,64/288,64/288,1 ), .2, .8, .5, 20 );


	model_transform = mult(model_transform, translation(0, 6, 0));
	model_transform = mult(model_transform, rotation(90, 1,0,0));
		model_transform = mult(model_transform, scale(0.5,0.5,12));
			this.m_cylinder.draw(this.graphicsState, model_transform, trafficPlastic);	
		model_transform = mult(model_transform, scale(1/0.5,1/0.5,1/12));
			model_transform = mult(model_transform, translation(0,0,-8.5));
				model_transform = mult(model_transform, scale(2.4,2,5));
					this.m_cube.draw(this.graphicsState, model_transform, trafficPlastic);	
				model_transform = mult(model_transform, scale(1/2.4,1/2,1/5));
				model_transform = mult(model_transform, scale(1.2,1.2,1.2));
					this.m_sphere.draw(this.graphicsState, model_transform, yellowPlastic);	
						model_transform = mult(model_transform, translation(0,0,-1));
							this.m_sphere.draw(this.graphicsState, model_transform, redPlastic);	
													model_transform = mult(model_transform, translation(0,0,2));
							this.m_sphere.draw(this.graphicsState, model_transform, greenPlastic);	
}

Animation.prototype.drawStopSign = function(model_transform)
{
	var stop = new Material( vec4( .5,.5,.5,1 ), .5, 1, 1, 40, "STOP.png" ), trafficPlastic = new Material( vec4( 64/288,64/288,64/288,1 ), .2, .8, .5, 20 );

	model_transform = mult(model_transform, rotation(90, 1,0,0));
		model_transform = mult(model_transform, scale(0.3,0.3,12));
			this.m_cylinder.draw(this.graphicsState, model_transform, trafficPlastic);	
		model_transform = mult(model_transform, scale(1/0.3,1/0.3,1/12));
	model_transform = mult(model_transform, rotation(-90, 1,0,0));

	model_transform = mult(model_transform, translation(0,6,0.4));
		model_transform = mult(model_transform, scale(3,3,10));
			this.m_octagon.draw( this.graphicsState, model_transform, stop );
}
Animation.prototype.drawStreet = function(model_transform, blackPlastic, lightGreyPlastic, whitePlastic, lamps)
{
//build the streets (work in progress)
	model_transform = mult(model_transform, translation(0, -1, -12));
	var reset = model_transform;

	model_transform = mult(model_transform, scale(50,2,20)); 
		this.m_cube.draw(this.graphicsState, model_transform, blackPlastic );
	model_transform = reset;

		model_transform = mult(model_transform, translation(0, 0, -10-5));
			model_transform = mult(model_transform, scale(50,3,10)); 
			this.m_cube.draw(this.graphicsState, model_transform, lightGreyPlastic );
	model_transform = reset;


	model_transform = mult(model_transform, translation(0, 0, 12));
		model_transform = mult(model_transform, scale(50,2,4)); 
			this.m_cube.draw(this.graphicsState, model_transform, whitePlastic );
		model_transform = mult(model_transform, scale(1/50,1/2,1/4)); 
			model_transform = mult(model_transform, translation(0, 0, 12));
				model_transform = mult(model_transform, scale(50,2,20)); 
					this.m_cube.draw(this.graphicsState, model_transform, blackPlastic );
						model_transform = mult(model_transform, scale(1/50,1/2,1/20)); 
	
	reset = model_transform;
	 model_transform = mult(model_transform, translation(0, 0, 10+5));
		model_transform = mult(model_transform, scale(50,3,10)); 
		this.m_cube.draw(this.graphicsState, model_transform, lightGreyPlastic );
	model_transform = reset;

	if(lamps)
	{
		model_transform = reset;
		model_transform = mult(model_transform, translation(-15, 7+1, -20-2-1-12));
			model_transform = mult(model_transform, rotation(-90, 0,1,0));
			 		this.drawLamp(model_transform);
		//model_transform = mult(model_transform, translation(0, 0, -30));
		//	this.drawLamp(model_transform);

		model_transform = mult(model_transform, rotation(180, 0,1,0));
		model_transform = mult(model_transform, translation(-46, 0, 0));
			this.drawLamp(model_transform);
	//	model_transform = mult(model_transform, translation(0, 0, -30));
	//		this.drawLamp(model_transform);
	}


}
Animation.prototype.populateArea = function(model_transform, num)
{
	var greenPlastic = new Material( vec4( 0.118,0.482,0.118,1 ), .2, .8, .5, 20 );

	var reset = model_transform;
	model_transform = mult(model_transform, scale(130,1,130));
	this.m_cube.draw(this.graphicsState, model_transform, greenPlastic);
	model_transform = reset;

	if( num == 1)
	{
 		this.drawBuilding1( mult(model_transform, translation(10,0,-20)) );
 		this.drawBuilding2( mult(model_transform, translation(20,0,20)) );
	}
	else if (num ==2)
	{
		this.drawBuilding1( mult(   mult( model_transform, scale(1,7/8,1)) , translation(30,0,30))) ;
		var temp = model_transform;
		temp = mult( temp, translation(-25,0,-25));
				temp = mult( temp, scale(1,4/5,1));

		this.drawBuilding1( temp);
		this.drawBuilding1( mult(   model_transform, translation(0,0,0)) );
		this.drawBuilding1( mult(   model_transform, translation(-15,0,45)) );
		this.drawBuilding1( mult(    model_transform, translation(50,0,-50)) );
	}
}

Animation.prototype.drawWorld = function(model_transform)
{		
	
	//	for(var i = 0; i < 10; i++)	
 	//		this.drawStreet(mult(model_transform, translation(50*i,0,0)), blackPlastic, lightGreyPlastic, whitePlastic, i%2==0);
 	var reset = model_transform;
	var skyPlastic = new Material( vec4( .5,.5,.5,1 ), .5, 1, 1, 40, "sky.png" ),

 	//first draw the sky
 	model_transform = mult(model_transform, translation(-550, 450, 0));
 	 	model_transform = mult(model_transform, scale(1, 1000, 1200));
 	 		this.m_cube.draw(this.graphicsState, model_transform, skyPlastic);
  	 	model_transform = mult(model_transform, scale(1, 1/1000, 1/1200));
	model_transform = mult(model_transform, translation(1100, 0, 0));
 	 	model_transform = mult(model_transform, scale(1, 1000, 1200));
 	 		this.m_cube.draw(this.graphicsState, model_transform, skyPlastic);
  	 	model_transform = mult(model_transform, scale(1, 1/1000, 1/1200));	

 	model_transform =reset;
 	model_transform = mult(model_transform, translation(0, 450, -550));
 	 	model_transform = mult(model_transform, scale(1102, 1000, 1));
 	 		this.m_cube.draw(this.graphicsState, model_transform, skyPlastic);
  	 	model_transform = mult(model_transform, scale(1/1102, 1/1000, 1));
 	model_transform = mult(model_transform, translation(0, 0, 1100));
 	 	model_transform = mult(model_transform, scale(1102, 1000, 1));
 	 		this.m_cube.draw(this.graphicsState, model_transform, skyPlastic);
  	 	model_transform = mult(model_transform, scale(1/1102, 1/1000, 1));

 	model_transform =reset;

 	for(var i = -1; i < 2; i++)
 	{
 		var stops = false;
 		var lights = false;
 		if(i == 0)
 			stops = true;
 		else
 			lights = true;
 		model_transform = mult(model_transform, translation((44+150) *i, 0, 0));
 		this.drawIntersection(model_transform, stops, lights);
 		model_transform = mult(model_transform, translation(0, 0, (44+150)));
 		this.drawIntersection(model_transform, stops, lights);
		model_transform = mult(model_transform, translation(0, 0, -2*(44+150)));
 		this.drawIntersection(model_transform, stops, lights);
		model_transform = reset;
 	}

 	//populate the areas around the intersections
 	model_transform = mult(model_transform, translation(-291,0,291));
 	this.populateArea(model_transform, 1);
  	model_transform = mult(model_transform, translation(0,0,-194));
 	this.populateArea(model_transform, 2);
  	model_transform = mult(model_transform, translation(0,0,-194));
 	this.populateArea(model_transform, 1);
 	model_transform = mult(model_transform, translation(0,0,-194));
 	this.populateArea(model_transform, 1);

 	model_transform = mult(model_transform, translation(194,0,0));
 	this.populateArea(model_transform, 1);
  	model_transform = mult(model_transform, translation(0,0,194));
 	this.populateArea(model_transform, 2);
  	model_transform = mult(model_transform, translation(0,0,194));
 	this.populateArea(model_transform, 2);
 	model_transform = mult(model_transform, translation(0,0,194));
 	this.populateArea(model_transform, 1);

 	model_transform = mult(model_transform, translation(194,0,0));
 	this.populateArea(model_transform, 1);
  	model_transform = mult(model_transform, translation(0,0,-194));
 	this.populateArea(model_transform, 1);
  	model_transform = mult(model_transform, translation(0,0,-194));
 	this.populateArea(model_transform, 1);
 	model_transform = mult(model_transform, translation(0,0,-194));
 	this.populateArea(model_transform, 2);

 	model_transform = mult(model_transform, translation(194,0,0));
 	this.populateArea(model_transform, 1);
  	model_transform = mult(model_transform, translation(0,0,194));
 	this.populateArea(model_transform, 2);
  	model_transform = mult(model_transform, translation(0,0,194));
 	this.populateArea(model_transform, 1);
 	model_transform = mult(model_transform, translation(0,0,194));
 	this.populateArea(model_transform, 1);
}
Animation.prototype.drawCross = function(model_transform)
{
	var whitePlastic = new Material( vec4( 1,1,1,1 ), .2, .8, .5, 20 ), blackPlastic = new Material( vec4( 0,0,0,1 ), .2, .8, 0, 20 );
	//make the back two squares
	var reset = model_transform;
 	for(var i = 0; i < 2; i++)
 	{
 		model_transform = mult(model_transform, translation(-12 + i*24, -1, -12)); //15 down, 12 back
			model_transform = mult(model_transform, scale(20,2,20)); //the block is only 
				this.m_cube.draw(this.graphicsState, model_transform, blackPlastic );
		model_transform = reset;
 	}
 	//make the front two squares
 	for(var i = 0; i < 2; i++)
 	{
 		model_transform = mult(model_transform, translation(-12 + i*24, -1, 12)); //15 down, 12 back
			model_transform = mult(model_transform, scale(20,2,20)); //the block is only 
				this.m_cube.draw(this.graphicsState, model_transform, blackPlastic );
		model_transform = reset;
 	}
 	//make the middle divider
 	model_transform = mult(model_transform, translation(0, -1, 0)); //15 down, 12 back
		model_transform = mult(model_transform, scale(44,2,4)); //the block is only 
			this.m_cube.draw(this.graphicsState, model_transform, whitePlastic );
	model_transform = reset;


 	//make the two smaller middle dividers
 	for(var i = 0; i < 2; i++)
 	{
 		var sign = 1;
 		if(i == 0)
 			sign = -1;

		model_transform = mult(model_transform, translation(0, -1, 12*sign)); //15 down, 12 back
			model_transform = mult(model_transform, scale(4,2,20)); //the block is only 
				this.m_cube.draw(this.graphicsState, model_transform, whitePlastic );
		model_transform = reset;
 	}

}

Animation.prototype.drawIntersection = function(model_transform, stops, lights)
{
		var purplePlastic = new Material( vec4( .9,.5,.9,1 ), .2, .5, .8, 40 ), // Omit the final (string) parameter if you want no texture
			greyPlastic = new Material( vec4( .5,.5,.5,1 ), .2, .8, .5, 20 ),
			whitePlastic = new Material( vec4( 1,1,1,1 ), .2, .8, .5, 20 ),
			blackPlastic = new Material( vec4( 0,0,0,1 ), .2, .8, 0, 20 ),
			bluePlastic = new Material( vec4( 0,102/288,204/288,1 ), .2, .8, .5, 20 ),
			yellowPlastic = new Material( vec4( 255/288,255/288,0,1 ), .2, .8, 0, 20 ),
			redPlastic = new Material( vec4( 255/288,0,0,1 ), .2, .8, .5, 20 ),
			greenPlastic = new Material( vec4( 0,204/288,0,1 ), .2, .8, .5, 20 ),
			trafficPlastic = new Material( vec4( 64/288,64/288,64/288,1 ), .2, .8, .5, 20 ),
			lightGreyPlastic = new Material( vec4( 220/288,220/288,220/288,1 ),.2, .8, .5, 20 ),
			earth = new Material( vec4( .5,.5,.5,1 ), .5, 1, .5, 40, "earth.gif" ),
			stars = new Material( vec4( .5,.5,.5,1 ), .5, 1, 1, 40, "stars.png" ),
			build3 = new Material( vec4( .5,.5,.5,1 ), .5, 1, 1, 40, "build3.png" ),
			stop = new Material( vec4( .5,.5,.5,1 ), .5, 1, 1, 40, "STOP.png" )
			;

 	this.drawCross(model_transform);
 	var reset = model_transform;
 	//draw left side
 	for(var i = 0; i <3 ; i++)
 	{
 		if(i > 0)
 			model_transform = mult(model_transform, translation(-25-25, 0, 0)); //15 down, 12 back
 		else
 			model_transform = mult(model_transform, translation(-25-22, 0, 0)); //15 down, 12 back
 		this.drawStreet(model_transform, blackPlastic, lightGreyPlastic, whitePlastic, true);
 	}
 	model_transform = reset;
 	//draw right side
 	for(var i = 0; i <3 ; i++)
 	{
 		if(i > 0)
 			model_transform = mult(model_transform, translation(25+25, 0, 0)); //15 down, 12 back
 		else
 			model_transform = mult(model_transform, translation(25+22, 0, 0)); //15 down, 12 back

 			this.drawStreet(model_transform, blackPlastic, lightGreyPlastic, whitePlastic, false);
 	}
 	model_transform = reset;
 	//draw top side
 	 model_transform = mult(model_transform, rotation(90, 0,1,0));
 	for(var i = 0; i <3 ; i++)
 	{	
 		if(i > 0)
 			model_transform = mult(model_transform, translation(25+25, 0, 0)); //15 down, 12 back
 		else
 			model_transform = mult(model_transform, translation(25+22, 0, 0)); //15 down, 12 back

 			this.drawStreet(model_transform, blackPlastic, lightGreyPlastic, whitePlastic, false);
 	}
 	model_transform = reset;
 	//draw bottom side
 	model_transform = mult(model_transform, rotation(90, 0,1,0));
 	for(var i = 0; i <3 ; i++)
 	{
 		if(i > 0)
 			model_transform = mult(model_transform, translation(-25-25, 0, 0)); //15 down, 12 back
 		else
 			model_transform = mult(model_transform, translation(-25-22, 0, 0)); //15 down, 12 back

 			this.drawStreet(model_transform, blackPlastic, lightGreyPlastic, whitePlastic, false);
 	}
 	
 	model_transform = reset;
 	if( stops ) //drawStop Signs
 	{
 		model_transform = mult(model_transform, translation(-24, 6, 24));
 		model_transform = mult(model_transform, rotation(-90, 0, 1, 0));
 		this.drawStopSign(model_transform);
 		model_transform = reset;

 		model_transform = mult(model_transform, translation(-24, 6, -24));
 		model_transform = mult(model_transform, rotation(180, 0, 1, 0));
 		this.drawStopSign(model_transform);
 		model_transform = reset;

 		model_transform = mult(model_transform, translation(24, 6, 24));
 		this.drawStopSign(model_transform);
 		model_transform = reset;

 		model_transform = mult(model_transform, translation(24, 6, -24));
 		model_transform = mult(model_transform, rotation(90, 0, 1, 0));
 		this.drawStopSign(model_transform);
 		model_transform = reset;
 	}
 	else if (lights)
 	{
 		model_transform = mult(model_transform, translation(-24, 0, 24));
 		model_transform = mult(model_transform, rotation(-90, 0, 1, 0));
 		this.drawTrafficLight(model_transform);
 		model_transform = reset;

 		model_transform = mult(model_transform, translation(-24, 0, -24));
 		model_transform = mult(model_transform, rotation(180, 0, 1, 0));
 		this.drawTrafficLight(model_transform);
 		model_transform = reset;

 		model_transform = mult(model_transform, translation(24, 0, 24));
 		this.drawTrafficLight(model_transform);
 		model_transform = reset;

 		model_transform = mult(model_transform, translation(24, 0, -24));
 		model_transform = mult(model_transform, rotation(90, 0, 1, 0));
 		this.drawTrafficLight(model_transform);
 		model_transform = reset;
 	}

}

Animation.prototype.drawCar = function(model_transform, myTime) {
//building a car DRAGON
	var whitePlastic = new Material( vec4( 1,1,1,1 ), .2, .8, .5, 20 ),			bluePlastic = new Material( vec4( 0,102/288,204/288,1 ), .2, .8, .5, 20 ), 			
	yellowPlastic = new Material( vec4( 255/288,255/288,0,1 ), .2, .8, 0, 20 ),
			redPlastic = new Material( vec4( 255/288,0,0,1 ), .2, .8, .5, 20 );
	if(myTime < 36 || myTime >45)
	{
		model_transform = mult(model_transform, translation(myTime*10, 0, 0));
	model_transform = mult(model_transform, translation(0,3,0));
	model_transform = mult(model_transform, scale(1.5,1,1.5));
	model_transform = mult(model_transform, scale(1, 1.8, 2));
	this.m_car.draw(this.graphicsState, model_transform, whitePlastic);
	 		model_transform = mult(model_transform, scale(1, 1/1.8, 1/2));

	model_transform = mult(model_transform, translation(0,-1,0));
		model_transform = mult(model_transform, scale(6, 2, 5));
	this.m_cube.draw(this.graphicsState, model_transform, bluePlastic);
 	model_transform = mult(model_transform, scale(1/6, 1/2, 1/5));

	model_transform = mult(model_transform, translation(0,-1,0));

	var reset = model_transform;
	//set the wheels
	for(var i = 0; i < 2; i++)
	{
		var offset = 0;
		if(i < 1)
			offset = 1.5; //front wheels
		else
			offset = -1.5; //back wheels
		model_transform = mult(model_transform, translation(offset,0,-1.5));
			this.m_cylinder.draw(this.graphicsState, model_transform, whitePlastic);
				model_transform = mult(model_transform, translation(0,0,-0.5));
				this.m_circle.draw(this.graphicsState, model_transform, whitePlastic);
			model_transform = mult(model_transform, translation(0,0,1));
				this.m_circle.draw(this.graphicsState, model_transform, whitePlastic);
			model_transform = mult(model_transform, translation(0,0,2.5));
		this.m_cylinder.draw(this.graphicsState, model_transform, whitePlastic);
				model_transform = mult(model_transform, translation(0,0,0.5));
				this.m_circle.draw(this.graphicsState, model_transform, whitePlastic);
			model_transform = mult(model_transform, translation(0,0,-1));
				this.m_circle.draw(this.graphicsState, model_transform, whitePlastic);
		model_transform = reset;
	}
	model_transform = mult(model_transform, translation(3,1,1.5));
			model_transform = mult(model_transform, scale(1/3,1/2,1/3));
		this.m_sphere.draw(this.graphicsState, model_transform, yellowPlastic);
	model_transform = mult(model_transform, translation(0,0,-9));
			this.m_sphere.draw(this.graphicsState, model_transform, yellowPlastic);
	model_transform = mult(model_transform, scale(3,2,3));

	model_transform = mult(model_transform, translation(-6,0,0));
			this.m_cube.draw(this.graphicsState, model_transform, redPlastic);
	model_transform = mult(model_transform, translation(0,0,3));
			this.m_cube.draw(this.graphicsState, model_transform, redPlastic);
	}

}
Animation.prototype.drawBlimp = function(model_transform, myTime) {
	var redPlastic = new Material( vec4( 255/288,0,0,1 ), .2, .8, .5, 20 );
	if ( myTime >= 20)
		model_transform = mult(model_transform, translation(Math.cos(myTime-20)+(myTime-20)*10, Math.sin(myTime-20), 0));
	model_transform = mult(model_transform, scale(8, 4, 4));
		this.m_sphere.draw(this.graphicsState, model_transform, redPlastic);
	model_transform = mult(model_transform, scale(4/8, 3/4, 2/4));
		model_transform = mult(model_transform, translation(0, -1, 0));
			this.m_cube.draw(this.graphicsState, model_transform, redPlastic);
	model_transform = mult(model_transform, scale(1/4, 1/3, 1));
	model_transform = mult(model_transform, translation(-7, 2, 0));
	model_transform = mult(model_transform, scale(1, 2, 1));

		this.m_cube.draw(this.graphicsState, model_transform, redPlastic);
}


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
			whitePlastic = new Material( vec4( 1,1,1,1 ), .2, .8, .5, 20 ),
			blackPlastic = new Material( vec4( 0,0,0,1 ), .2, .8, 0, 20 ),
			bluePlastic = new Material( vec4( 0,102/288,204/288,1 ), .2, .8, .5, 20 ),
			yellowPlastic = new Material( vec4( 255/288,255/288,0,1 ), .2, .8, 0, 20 ),
			redPlastic = new Material( vec4( 255/288,0,0,1 ), .2, .8, .5, 20 ),
			greenPlastic = new Material( vec4( 0,204/288,0,1 ), .2, .8, .5, 20 ),
			trafficPlastic = new Material( vec4( 64/288,64/288,64/288,1 ), .2, .8, .5, 20 ),
			lightGreyPlastic = new Material( vec4( 220/288,220/288,220/288,1 ),.2, .8, .5, 20 ),
			earth = new Material( vec4( .5,.5,.5,1 ), .5, 1, .5, 40, "earth.gif" ),
			stars = new Material( vec4( .5,.5,.5,1 ), .5, 1, 1, 40, "stars.png" ),
			build2 = new Material( vec4( .5,.5,.5,1 ), .5, 1, 1, 40, "modern.png" ),
			build3 = new Material( vec4( .5,.5,.5,1 ), .5, 1, 1, 40, "build3.png" ),
			stop = new Material( vec4( .5,.5,.5,1 ), .5, 1, 1, 40, "STOP.png" )
			;
			
		/**********************************
		Start coding here!!!!
		**********************************/
		//model_transform = mult(model_transform, translation(0, 10, 0));
		var myTime =  this.graphicsState.animation_time/1000;
		var reset = model_transform;

		if (myTime < 15)
				this.graphicsState.camera_transform = lookAt( vec3(-400+myTime*20,20,0), vec3(-300+myTime*10,3,10), vec3(0,1,0) ); //position of camera, direction looking, up vector
		else if (myTime <20)
				this.graphicsState.camera_transform = lookAt(vec3(-100+(myTime-15)*2,20,0), vec3(-150, 3+(myTime-15)*10,10+(myTime-15)*4), vec3(0,1,0));
		else if (myTime <45)
			this.graphicsState.camera_transform = lookAt(  vec3(-90+(myTime-20)*12  ,40 ,-1*(myTime-20)) , vec3(-150+Math.cos(myTime-20)+(myTime-20)*10, 53+Math.sin(myTime-20,30)), vec3(0,1,0)  );
		else		
			this.graphicsState.camera_transform = lookAt(vec3(-90,30,0), vec3(150, 40, 0), vec3(0,1,0));

 		this.drawWorld(model_transform);
 		model_transform = mult(model_transform, translation(-300, 0, 10));
 		this.drawCar(model_transform, myTime);


 		model_transform = mult(model_transform, translation(300, 0, -22));
 		model_transform = mult(model_transform, rotation(180, 0, 1,0));

 		this.drawCar(model_transform, myTime);

 		model_transform = reset;
 		model_transform = mult(model_transform, translation(-150, 53,30));
 		this.drawBlimp(model_transform, myTime);



		/* //this is some code for checking shear
		this.m_cube.draw(this.graphicsState, model_transform, purplePlastic);
		model_transform = mult(model_transform, translation(-2,0,0));
		//model_transform = mult(model_transform, rotation(45,0,0,1));
		model_transform = mult(model_transform, rotation(45, 1, 0, 0));
				model_transform = mult(model_transform, scale(0.5,0.5,3));

		this.m_cube.draw(this.graphicsState, model_transform, greyPlastic);
		*/
	}	



Animation.prototype.update_strings = function( debug_screen_strings )		// Strings this particular class contributes to the UI
{	
	debug_screen_strings.string_map["frames"] = "FPS: " + 1000/this.animation_delta_time;
	debug_screen_strings.string_map["time"] = "Animation Time: " + this.graphicsState.animation_time/1000 + "s";
	debug_screen_strings.string_map["basis"] = "Showing basis: " + this.m_axis.basis_selection;
	debug_screen_strings.string_map["animate"] = "Animation " + (animate ? "on" : "off") ;
	debug_screen_strings.string_map["thrust"] = "Thrust: " + thrust;
}