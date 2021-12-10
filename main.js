const { resolve, basename } = require('path')
const spawn = require('cross-spawn')
const { 
    app, 
    Tray,
    Menu, 
    dialog,
    MenuItem
} = require('electron')

const Store = require('electron-store')
const schema = {
    projects: {
        type: 'string',
    },
}
const store = new Store({ schema });

let tray = null
app.whenReady().then(() => {

    tray = new Tray(resolve(__dirname, 'assets/tray-icons', 'iconTemplate.png'))

    const storedProjects = store.get('projects')
    const projects = storedProjects ? JSON.parse(storedProjects) : []

    const items = projects.map((project) => {
        return { 
            label: `> ${project.name}`, 
            click: () => {
                spawn.sync('code', [project.path])
            }
        }
    })

    const contextMenu = Menu.buildFromTemplate([
        ...items,
        {
            type: 'separator',
        },
    ])

    contextMenu.insert(0, new MenuItem({ 
        label: '+ Add Project...',
        click: () => {

            dialog.showOpenDialog({properties: ['openDirectory']})
            .then((data) => {
                const path = data.filePaths[0]
                if(path)
                {
                    const name = basename(path)
                    store.set('projects', JSON.stringify([
                        ...projects, {
                            path: path,
                            name: name
                        }
                    ]))
                    const item = new MenuItem({ label: name, click: () => {
                        spawn.sync('code', [path])
                    } })
                    contextMenu.append(item)
                }
            })
        }
    }))

    contextMenu.insert(1, new MenuItem({ 
        type: 'separator'
    }))
    
    contextMenu.insert(2, new MenuItem({ 
        label: '// Reset list',
        click: () => {
            dialog.showMessageBox(null, {
                type: 'question',
                buttons: ['Cancel', 'Reset'],
                defaultId: 1,
                title: "Hol'up",
                message: "Are you sure?",
                detail: "This will remove all listed projects"
            })
            .then((data)=>{
                if(data.response == 1)
                {
                    store.clear()
                    app.relaunch()
                    app.quit()
                }
            })
        }
    }))
    contextMenu.insert(3, new MenuItem({ 
        label: '- Quit',
        click: () => {
            app.quit()
        }
    }))
    
    contextMenu.insert(4, new MenuItem({ 
        type: 'separator'
    }))
    tray.setContextMenu(contextMenu)
    tray.on('click', () => {(tray.popUpContextMenu())})
    tray.setToolTip("Code Tray")
})