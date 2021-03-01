class Viewer {
  _canvas = null
  _engine = null
  _baseScene = null
  _camera = null

  _createDefaultEngine() {
    return new BABYLON.Engine(this._canvas, true, {
      preserveDrawingBuffer: true,
      disableWebGL2Support: false,
      stencil: true,
    })
  }

  async _initEngine() {
    const asyncEngineCreation = async () => {
      try {
        return this._createDefaultEngine()
      } catch (e) {
        return this._createDefaultEngine()
      }
    }

    this._engine = await asyncEngineCreation()

    if (!this._engine) throw 'engine should not be null.'
  }

  _setBaseScene() {
    this._baseScene = new BABYLON.Scene(this._engine)

    this._camera = new BABYLON.ArcRotateCamera(
      `camera1`,
      -Math.PI / 2,
      1,
      10,
      BABYLON.Vector3.Zero(),
      this._baseScene
    )

    this._camera.attachControl(this._canvas, true)

    const light = new BABYLON.HemisphericLight(
      `light`,
      new BABYLON.Vector3(0, 1, 0),
      this._baseScene
    )

    light.intensity = 0.8

    BABYLON.MeshBuilder.CreateGround(
      `ground`,
      { width: 6, height: 6 },
      this._baseScene
    )
  }

  async render(canvas) {
    if (!canvas) throw 'canvas should not be null.'

    this._canvas = canvas

    await this._initEngine()
    await this._setBaseScene()

    this._engine.runRenderLoop(() => {
      if (this._baseScene.activeCamera) {
        this._baseScene.render()
      }
    })
  }

  Append(glTFString) {
    BABYLON.SceneLoader.Append(
      ``,
      glTFString,
      this._baseScene,
      function (newScene) {
        console.log(`success Append, newScene`, newScene)
      }
    )
  }
}

const viewer = new Viewer()

document.getElementById(`load-file`).addEventListener(
  `change`,
  ({
    target: {
      files: [file],
    },
  }) => {
    if (!file) throw 'file should not be null.'

    var reader = new FileReader()

    reader.onload = function (e) {
      console.log(`"${file.name}" is readed`)
      const glTFString = e.target.result

      viewer.Append(glTFString)
    }

    reader.readAsDataURL(file)
  }
)

viewer.render(document.getElementById(`renderCanvas`))
