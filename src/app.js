class Viewer {
  _canvas = null
  _engine = null
  _camera = null
  _light = null
  _baseScene = null
  _scenes = new Set()
  _meshes = new Map()
  _tree = null
  _highlightMaterial = null

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
      `camera`,
      -Math.PI / 2,
      1,
      10,
      BABYLON.Vector3.Zero(),
      this._baseScene
    )
    this._camera.attachControl(this._canvas, true)
    this._light = new BABYLON.HemisphericLight(
      `light`,
      new BABYLON.Vector3(0, 1, 0),
      this._baseScene
    )
    this._light.intensity = 0.8
    this._highlightMaterial = new BABYLON.StandardMaterial(
      `highlight`,
      this._baseScene
    )
    this._highlightMaterial.diffuseColor = new BABYLON.Color3(1, 0, 1)
    this._highlightMaterial.specularColor = new BABYLON.Color3(0.5, 0.6, 0.87)
    this._highlightMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1)
    this._highlightMaterial.ambientColor = new BABYLON.Color3(0.23, 0.98, 0.53)
    this._baseScene.onPointerObservable.add(this._onPointer)
  }

  render = async (canvas, tree) => {
    if (!canvas) throw 'canvas should not be null.'
    this._canvas = canvas
    this._tree = tree
    await this._initEngine()
    await this._setBaseScene()
    this._engine.runRenderLoop(
      () => this._baseScene.activeCamera && this._baseScene.render()
    )
  }

  Append = (glTFString) =>
    BABYLON.SceneLoader.Append(``, glTFString, this._baseScene, (scene) => {
      scene.meshes.forEach(
        (mesh) => (mesh.scaling = new BABYLON.Vector3(4, 4, 4))
      )
      this._scenes.add(scene)
      this._rebuildNodes()
    })

  Clear = () =>
    this._scenes.forEach((scene) => {
      scene.meshes.forEach((mesh) => mesh.dispose())
      this._scenes.delete(scene)
    })

  _onPointer = (pointerInfo) => {
    if (
      pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN &&
      pointerInfo.pickInfo.pickedMesh
    ) {
      this._pickMesh(pointerInfo.pickInfo.pickedMesh)
    }
  }

  _pickMesh = (mesh) => {
    if (this._meshes.has(mesh.uniqueId)) {
      mesh.material = this._meshes.get(mesh.uniqueId)
      this._meshes.delete(mesh.uniqueId)
    } else {
      this._meshes.set(mesh.uniqueId, mesh.material)
      mesh.material = this._highlightMaterial
    }
  }

  _rebuildNodes = () => {
    if (!this._tree) {
      return
    }

    const getNodes = (nodes) =>
      nodes.map(({ uniqueId, id, name, _children }) => ({
        children: Array.isArray(_children) ? getNodes(_children) : [],
        uniqueId,
        name,
        id,
      }))

    this._renderTree(getNodes(this._baseScene.rootNodes))
  }

  _renderTree = (nodes) => {
    this._tree.innerHTML = ``
    nodes.forEach((node) => this._renderNode(this._tree, node))
  }

  _renderNode = (parentNode, node) => {
    const div = document.createElement(`div`)
    const text = document.createElement(`span`)
    const control = document.createElement(`span`)

    if (node.children.length) {
      control.className = `control`
      control.textContent = `+`
      div.appendChild(control)
      control.addEventListener(`click`, this._toggleSublist)
    }

    text.className = `text`
    text.textContent = node.name
    text.setAttribute(`title`, node.name)
    div.className = `node`
    div.appendChild(text)
    text.setAttribute(`data-id`, node.uniqueId)
    text.addEventListener(`click`, this._pickNode)

    if (node.children.length) {
      const children = document.createElement(`div`)

      node.children.forEach((node) => this._renderNode(children, node))
      children.className = `children`
      div.appendChild(children)
    }

    parentNode.appendChild(div)
  }

  _toggleSublist = ({ target: control }) => {
    const children = control.parentNode.querySelector(`.children`)
    const isOpen = control.getAttribute(`data-open`) === `true`

    if (isOpen) {
      control.textContent = `+`
      control.setAttribute(`data-open`, `false`)
      children.style.display = 'none'
    } else {
      control.textContent = `-`
      control.setAttribute(`data-open`, `true`)
      children.style.display = 'block'
    }
  }

  _pickNode = ({ target }) => {
    const uniqueId = +target.getAttribute(`data-id`)
    const mesh = this._baseScene.getMeshByUniqueID(uniqueId)

    mesh && this._pickMesh(mesh)
  }
}

const $ = (id) => document.getElementById(id)
const viewer = new Viewer()

$(`load-file`).addEventListener(
  `change`,
  ({
    target: {
      files: [file],
    },
  }) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      console.log(`"${file.name}" was append successfully`)
      viewer.Append(e.target.result)
    }

    reader.readAsDataURL(file)
  }
)

viewer.render($(`renderCanvas`), $(`nodesTree`))

$(`clearCanvas`).addEventListener(`click`, viewer.Clear)

console.log(viewer)
