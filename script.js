import Stats from './modules/stats.module.js';
import { OrbitControls } from './modules/OrbitControls.js';
import './modules/OBJLoader.js';
import './modules/MTLLoader.js';
import { GUI } from './modules/gui.js';


var container, stats;
var camera, controls, scene, raycaster, renderer;
var plane = [];
var cells = [];
var treeObject, skyscraperObject, windmillObject, houseObject;
var locations = [];
var mouse = new THREE.Vector2(), INTERSECTED, INTERSECTED_INDEX;

var CELL_SIZE = 80;
var X_RES = 30, Y_RES = 30;
var grid = Array.from(Array(Y_RES), _ => Array(X_RES).fill(0))
var planeWidth = 2 * X_RES * CELL_SIZE;
var planeHeight = 2 * Y_RES * CELL_SIZE;

var X_ROAD = 2, Y_ROAD = 2;
var X_START = X_RES - Math.floor(X_ROAD / 2);
var Y_START = Y_RES - Math.floor(X_ROAD / 2);

var moves = [[0, 0],
            [1, 0],
            [1, -1],
            [0, -1],
            [-1, -1],
            [-1, 0],
            [-1, 1],
            [0, 1],
            [1, 1],
            [2, 1],
            [2, 0],
            [2, -1],
            [2, -2],
            [1, -2],
            [0, -2],
            [-1, -2],
            [-2, -2],
            [-2, -1],
            [-2, 0],
            [-2, 1],
            [-2, 2],
            [-1, 2],
            [0, 2],
            [1, 2],
            [2, 2],
            [3, 2],
            [3, 1],
            [3, 0],
            [3, -1],
            [3, -2],
            [3, -3],
            [2, -3],
            [1, -3],
            [0, -3],
            [-1, -3],
            [-2, -3],
            [-3, -3],
            [-3, -2],
            [-3, -1],
            [-3, 0],
            [-3, 1],
            [-3, 2],
            [-3, 3],
            [-2, 3],
            [-1, 3],
            [0, 3],
            [1, 3],
            [2, 3],
            [3, 3]]

var roadPlants = new Array(25).fill(false);

var originalWarning = console.warn; // back up the original method
console.warn = function(){}; // now warnings do nothing!


init();
animate();

function init() {


    container = document.getElementById( "my_canvas" );

    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.z = 400;
    camera.position.y = 500;
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x96fffc );
    scene.add( new THREE.AmbientLight( 0x555555 ) );

    var ambientLight = new THREE.AmbientLight( 0xcccccc, 0.4 );
    scene.add( ambientLight );
    var pointLight = new THREE.PointLight( 0xffffff, 1.5 );
    camera.add( pointLight );
    scene.add(camera)
    scene.castShadow = true;

    draw();

    

    raycaster = new THREE.Raycaster();

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );

    controls = new OrbitControls( camera, renderer.domElement );
    controls.update();

    stats = new Stats();
    container.appendChild( stats.dom );
    renderer.domElement.addEventListener( 'mousemove', onMouseMove );

    var $body = $('body');
    $body.on('mousedown', function (evt) {
        $body.on('mouseup mousemove', function handler(evt) {
          if (evt.type === 'mouseup') {
            onClick( evt )
            console.log('click')
          } else {
            console.log('drag')
          }
          $body.off('mouseup mousemove', handler);
        });
      });

}



function onMouseMove( e ) {
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}



function onClick( e ) {
    if(INTERSECTED && INTERSECTED_INDEX >= -1) {
        var win = window.open(INTERSECTED.userObject.url, '_blank');
        win.focus();
    }
}



function animate() {
    requestAnimationFrame( animate );
    render();
    stats.update();
}



function render() {
    controls.update();
    renderer.setRenderTarget( null );
    renderer.render( scene, camera );
    checkIntersections();
    TWEEN.update();


}



function checkIntersections() {

    raycaster.setFromCamera( mouse, camera );
    var intersects = raycaster.intersectObjects( scene.children, true );
    if ( intersects.length > 0 ) {
        if ( INTERSECTED != intersects[ 0 ].object ) {


            if(INTERSECTED && INTERSECTED_INDEX >= 0) {
                INTERSECTED.material[ INTERSECTED_INDEX ].emissive.setHex( INTERSECTED.currentHex );
            }
            
            else if(INTERSECTED && INTERSECTED_INDEX >= -1) {
                INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
            }

            INTERSECTED = intersects[ 0 ].object;

            switch (INTERSECTED.userObject.type) {
                case "tree": 
                    INTERSECTED_INDEX = 1
                    break;
                case "skyscraper": 
                    INTERSECTED_INDEX = -1
                    break;
                case "windmill": 
                    INTERSECTED_INDEX = -1
                    break;
                case "house": 
                    INTERSECTED_INDEX = -1
                    break;
                default: 
                    INTERSECTED_INDEX = -2
                    break;
            }

            if(INTERSECTED_INDEX >= 0) {
                INTERSECTED.currentHex = INTERSECTED.material[ INTERSECTED_INDEX ].emissive.getHex();
                INTERSECTED.material[ INTERSECTED_INDEX ].emissive.setHex( 0xff0000 );
            }

            else if(INTERSECTED_INDEX >= -1) {
                INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
                INTERSECTED.material.emissive.setHex( 0xff0000 );
            }


        }
    } else {
        
        if(INTERSECTED && INTERSECTED_INDEX >= 0) {
            INTERSECTED.material[ INTERSECTED_INDEX ].emissive.setHex( INTERSECTED.currentHex );
        }

        else if(INTERSECTED && INTERSECTED_INDEX >= -1) {
            INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
        }

        INTERSECTED = null;
        INTERSECTED_INDEX = -2
    }

}



function draw() {

    var geometry = new THREE.PlaneGeometry( planeWidth, planeHeight );
    var material = new THREE.MeshBasicMaterial( {color: 0xc5ff87, side: THREE.DoubleSide} );
    plane[0] = new THREE.Mesh( geometry, material );
    plane[0].rotation.x = -Math.PI / 2;
    plane[0].userObject = { "type": "plane" }
    scene.add( plane[0] );
    var geometry = new THREE.PlaneGeometry( planeWidth+15, planeHeight+15 );
    var material = new THREE.MeshBasicMaterial( {color: 0xa6f74f, side: THREE.DoubleSide} );
    plane[1] = new THREE.Mesh( geometry, material );
    plane[1].rotation.x = -Math.PI / 2;
    plane[1].position.y = -5
    plane[1].userObject = { "type": "plane" }
    scene.add( plane[1] );


    var cellGeometry = new THREE.PlaneGeometry( CELL_SIZE, CELL_SIZE );
    for(var y = 0; y < 2*Y_RES; y++) {
        cells[y] = [];
    }


    
    loadAsset("skyscraper");
    setTimeout( function(){ loadAsset("windmill"); }, 1000);
    setTimeout( function(){ loadAsset("house"); }, 2000);
    setTimeout( function(){ loadAsset("tree"); }, 2000);

}



function loadLocations(asset) {
    $.getJSON("data/history_frequency.json", function(json) {
        var index = 0
        var X_START_A = X_START
        var Y_START_A = Y_START
        var numConflictsThres = 10
        var move = 0
        $.each( json, function( url, data ) {

            var freq = data["frq"]
            var type = data["typ"]
            if (type == asset) {

                if(!roadPlants[move]) {
                    plantRoadBlock(Y_START_A-1, X_START_A-1, 2*Y_ROAD+1, 2*X_ROAD+1, index*100);
                    roadPlants[move] = true;
                }

                var numConflicts = 0
                var hasConflict = true

                while(numConflicts < numConflictsThres && hasConflict) {

                    hasConflict = false

                    var ix = Math.floor(2 * (Math.random() - 0.5) * X_ROAD) + X_ROAD + X_START_A;
                    var iy = Math.floor(2 * (Math.random() - 0.5) * Y_ROAD) + Y_ROAD + Y_START_A;
                    var px = CELL_SIZE * (ix - X_RES);
                    var py = 0
                    var pz = CELL_SIZE * (iy - Y_RES);
                    var pos = new THREE.Vector3(px,py,pz)

                    for(var i = 0; i < locations.length; i++) {
                        if(locations[i].distanceTo(pos) < 100) {
                            hasConflict = true
                            break
                        }
                    }

                    numConflicts++
                }

                if(hasConflict) {
                    console.log(move);
                    move++;
                    var nextX = moves[move][0];
                    var nextY = moves[move][1];
                    X_START_A = X_START + (2*X_ROAD + 1) * nextX;
                    Y_START_A = Y_START + (2*Y_ROAD + 1) * nextY;
                }


                var size = 1
                if(asset == "windmill") { size = 3 }
                if(asset == "house") { size = 3 }

                var sx = Math.log(freq + 10) * size
                var sy = sx
                var sz = sx
                var rx = 0
                var ry = 0
                var rz = 0
                var pos = new THREE.Vector3(px,py,pz)
                var scale = new THREE.Vector3(sx, sy, sz)
                var rot = new THREE.Vector3(rx, ry, rz)
                locations.push( pos )
                plantAsset( asset, pos, scale, rot, index*50, url )
                plantCell( asset, iy, ix, index*50 )
                
                index++
            }

        });
    });
}


function getAsset(asset) {

    switch (asset) {
        case "tree": 
            return treeObject
        case "skyscraper": 
            return skyscraperObject
        case "windmill": 
            return windmillObject
        case "house": 
            return houseObject
    }

    return null;
}



function plantAsset(asset, pos, scale, rot, delay, url) {

    var assetObject = getAsset(asset);

    var recursive = (asset == "tree");

    // clone obj and mtl
    if (recursive) {
        var clonedMaterials = []
        for(var i = 0; i < assetObject.children[0].material.length; i++) {
            clonedMaterials.push( assetObject.children[0].material[i].clone() )
        }
        var assetClone = assetObject.clone( true )
        assetClone.children[0].material = clonedMaterials
    }
    else {
        var clonedMaterial = assetObject.children[0].material.clone()
        var assetClone = assetObject.clone( true )
        assetClone.children[0].material = clonedMaterial    
    }
    
    // init transformations and data
    assetClone.position.set( pos.x, pos.y, pos.z )
    assetClone.scale.set( 0, 0, 0 )
    assetClone.rotation.set( rot.x, rot.y, rot.z )
    var assetData = {
        "type": asset,
        "url": url
    }
    assetClone.userObject = assetData

    // apply data to childen
    assetClone.traverse ( function (child) {
        child.userObject = assetData
    } );
    
    scene.add(assetClone)

    
    // init tweening
    var init = { x : 0, y: 0, z: 0 };
    var target = { x : scale.x, y: scale.y, z: scale.z };
    var tween = new TWEEN.Tween(init).to(target, 1500);
    tween.easing(TWEEN.Easing.Elastic.InOut)
    tween.delay(delay)
    tween.onUpdate(function(){
        assetClone.scale.x = init.x;
        assetClone.scale.y = init.y;
        assetClone.scale.z = init.z;
    });
    tween.start()
    

}



function plantRoadBlock(y, x, dy, dx, o) {

    var dt = 50

    for(var i = x; i < x + dx; i++) {
        plantRoad(y,    i, 1, o + (i-x)*dt );
        plantRoad(y+dy, i, 1, o + dx*dt + dy*dt + (i-x)*dt);
    }
    for(var i = y; i < y + dy; i++) {
        plantRoad(i, x+dx, 0, o + dx*dt + (i-y)*dt );
        plantRoad(i, x,    0, o + 2*dx*dt + dy*dt + (i-y)*dt);
    }

    plantRoad(y,    x+dx, 2, o);
    plantRoad(y+dy, x+dx, 2, o);
    plantRoad(y+dy, x,    2, o);
    plantRoad(y,    x,    2, o);
}



function plantRoad(y, x, dir, delay) {

    
    var colorHex = new THREE.Color( 0xb0b0b0 );
    var colorHighlight = new THREE.Color( 0xffef75 );
    
    var cellGeometry = new THREE.PlaneGeometry( CELL_SIZE, CELL_SIZE );
    var cellMaterial = new THREE.MeshBasicMaterial( {color: colorHex, side: THREE.DoubleSide} );
    
    var highlightGeometry = new THREE.PlaneGeometry( CELL_SIZE/5, CELL_SIZE/20 );
    var highlightMaterial = new THREE.MeshBasicMaterial( {color: colorHighlight, side: THREE.DoubleSide} );

    var highlights = new THREE.Mesh( highlightGeometry, highlightMaterial );
    highlights.position.x = CELL_SIZE * (x - X_RES);
    highlights.position.y = 2;
    highlights.position.z = CELL_SIZE * (y - Y_RES);
    
    highlights.rotation.z = Math.PI / 2;
    highlights.rotation.x = Math.PI / 2;

    if(dir == 0) {
        scene.add( highlights ); 
    }
    else if(dir == 1) {
        highlights.rotation.z = Math.PI;
        scene.add( highlights ); 
    }
    else if(dir == 2) {
        scene.add( highlights ); 
        highlights = highlights.clone();
        highlights.rotation.z = Math.PI;
        scene.add( highlights ); 
    } 


    var target = { x : CELL_SIZE * (x - X_RES), 
        y: 1, 
        z: CELL_SIZE * (y - Y_RES) };

    var init = {   x : CELL_SIZE * (x - X_RES), 
            y: 1000, 
            z: CELL_SIZE * (y - Y_RES) };
    

    var roadCell = new THREE.Mesh( cellGeometry, cellMaterial );
    cells[y,x] = roadCell
    cells[y,x].rotation.x = -Math.PI / 2;
    cells[y,x].position.set( init );
    cells[y,x].userObject = { "type": "cell" }
    scene.add( cells[y,x] ); 

        
    // init tweening
    var tween = new TWEEN.Tween(init).to(target, 500);
    tween.easing(TWEEN.Easing.Quadratic.Out)
    tween.delay(delay)
    tween.onUpdate(function(){
        roadCell.position.x = init.x;
        roadCell.position.y = init.y;
        roadCell.position.z = init.z;
    });
    tween.start()
    

}


function plantCell(asset, y, x, delay) {
    
    var colorHex = new THREE.Color( 0xffffff );
    switch (asset) {
        case "tree":
            colorHex = new THREE.Color( 0xd4af9f );
            break;
        case "skyscraper": 
            colorHex = new THREE.Color( 0xc7c7c7 );
            break;
        case "windmill": 
            colorHex = new THREE.Color( 0xe6daba );
            break;

    }



    var pos = { x : CELL_SIZE * (x - X_RES), 
        y: 1, 
        z: CELL_SIZE * (y - Y_RES) };

    var init = { x : 0, y: 0, z: 0 };
    var target = { x : 1, y: 1, z: 1 };

    
    var cellGeometry = new THREE.PlaneGeometry( CELL_SIZE, CELL_SIZE );
    var cellMaterial = new THREE.MeshBasicMaterial( {color: colorHex, side: THREE.DoubleSide} );
    
    var roadCell = new THREE.Mesh( cellGeometry, cellMaterial );
    cells[y,x] = roadCell;
    cells[y,x].rotation.x = -Math.PI / 2;
    cells[y,x].position.x = pos.x;
    cells[y,x].position.y = pos.y;
    cells[y,x].position.z = pos.z;
    cells[y,x].scale.x = init.x;
    cells[y,x].scale.y = init.y;
    cells[y,x].scale.z = init.z;
    cells[y,x].userObject = { "type": "cell" }
    scene.add( cells[y,x] ); 

    
    // init tweening
    var tween = new TWEEN.Tween(init).to(target, 1500);
    tween.easing(TWEEN.Easing.Elastic.In)
    tween.delay(delay)
    tween.onUpdate(function(){
        roadCell.scale.x = init.x;
        roadCell.scale.y = init.y;
        roadCell.scale.z = init.z;
    });
    tween.start()
    
}



function loadAsset(asset) {

    // asset types: tree
    //              skyscraper
    //              windmill
    //              house

    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.load( "assets/" + asset + ".mtl", function( materials ) {
        materials.preload();
        materials.flatShading = true;
        materials.light = true;
        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials( materials );
        objLoader.load("assets/" + asset + ".obj", function ( object ) {
            
            switch (asset) {
                case "tree": 
                    treeObject = object;
                    treeObject.castShadow = true;
                    treeObject.traverse ( function (child) {
                        child.castShadow = true;
                    } );
                    loadLocations(asset);
                    break;
                case "skyscraper": 
                    skyscraperObject = object;
                    loadLocations(asset);
                    break;
                case "windmill": 
                    windmillObject = object;
                    loadLocations(asset);
                    break;
                case "house": 
                    houseObject = object;
                    loadLocations(asset);
                    break;
            }
            
        });
    });
}




function scalePlane() {
    var scale = plane[0].scale.multiplyScalar(2)
    planeWidth *= 2
    planeHeight *= 2
    plane[0].scale.set( scale.x, scale.y, scale.z)
    plane[1].scale.set( scale.x, scale.y, scale.z)
    console.log('scaleUp')
}