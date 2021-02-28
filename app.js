var canvas = document.getElementById("renderCanvas");

var engine = null;
var scene = null;
var sceneToRender = null;
var createDefaultEngine = function() {
  return new BABYLON.Engine(
    canvas,
    true,
    {
      preserveDrawingBuffer: true,
      stencil: true,
      disableWebGL2Support: false
    }
  )
}
var initEngine = async function() {
  var asyncEngineCreation = async function() {
    try {
      return createDefaultEngine();
    } catch(e) {
      console.log("the available createEngine function failed. Creating the default engine instead");
      return createDefaultEngine();
    }
  }

  engine = await asyncEngineCreation();
  if (!engine) throw 'engine should not be null.';
}
var createScene = function () {
  scene = new BABYLON.Scene(engine)
  // demo
  var camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 5, -10), scene)
  camera.setTarget(BABYLON.Vector3.Zero())
  camera.attachControl(canvas, true)
  var light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene)
  light.intensity = 0.7
  var sphere = BABYLON.MeshBuilder.CreateSphere('sphere', { diameter: 2, segments: 32 }, scene)
  sphere.position.y = 1
  BABYLON.MeshBuilder.CreateGround('ground', { width: 6, height: 6 }, scene) // ground
}
var loadFile = function({ target: { files: [file] } }) {
  if (!file) throw 'file should not be null.'

  var reader = new FileReader()

  reader.onload = function(e) {
    console.log(`${file.name} is readed`)
    console.log(`?e.target.result`, e.target.result)

    /*BABYLON.SceneLoader.Load("./", url, engine, function(scene) {
      resolve(engine, scene)
    })*/
  }

  reader.readAsDataURL(file)
}

document.getElementById('load-file')
  .addEventListener('change', loadFile)

initEngine()
  .then(() => {
    createScene()

    sceneToRender = scene
    engine.runRenderLoop(() => {
      if (sceneToRender && sceneToRender.activeCamera) {
        sceneToRender.render()
      }
    })
  })
