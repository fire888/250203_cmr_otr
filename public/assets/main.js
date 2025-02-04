(() => {
  /*********** Глобальные переменные и состояния *****************************/
  
  const OFFSET_W = 50
  let w, h, minKey
  let appData = null
  const contentWrapper = document.querySelector('.content')

  const updateDimensions = () => {
    w = window.innerWidth;
    h = window.innerHeight;
    minKey = w < h ? 'w' : 'h'
  };

  updateDimensions()
  window.addEventListener('resize', updateDimensions)

  /*********** Утилиты *******************************************************/

  const loadJson = async (url) => {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Network response was not OK: ${response.status}`);
      }
      return await response.json()
    } catch (error) {
      console.error('Fetch error:', error)
      return null
    }
  }

  const parseUrlParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      nodeId: urlParams.get('node') || null,
      listId: urlParams.get('list') || null,
    }
  }

  const clearContent = () => {
    contentWrapper.innerHTML = ''
    window.scrollTo(0, 0)
  }

  /*********** Рисование элементов  ******************************************/

  const drawImage = async (src, wrapper) => {
    return new Promise((resolve) => {
      const img = document.createElement('img')
      img.onload = () => {
        wrapper.appendChild(img)
        resolve()
      }
      img.src = src
    })
  }

  const drawImageSizeScreen = async (src, wrapper) => {
    return new Promise((resolve) => {
      const img = document.createElement('img')
      if (minKey === 'w') {
        img.style.width = (w - OFFSET_W) + 'px'
        img.style.height = 'auto'
      } else {
        img.style.height = (h - OFFSET_W) + 'px'
        img.style.width = 'auto'
      }
      img.onload = () => {
        wrapper.appendChild(img)
        resolve()
      }
      img.src = src
    })
  }

  const drawText = (text, wrapper, size = 16) => {
    const p = document.createElement('p')
    p.innerHTML = text
    p.style.fontSize = `${size}px`
    wrapper.appendChild(p)
  }

  const drawEmptyLine = (wrapper, h = 30) => {
    const elem = document.createElement('div')
    elem.style.minHeight = h + 'px'
    wrapper.appendChild(elem)
}

  /*********** Рисование контейнеров *****************************************/

  const drawPreviewNode = async (nodeId, parent) => {
    const node = appData.nodes.find((n) => n.id === nodeId)
    if (!node || !node.isPublished) return;

    const el = document.createElement('div')
    el.classList.add('view-list-item')
    el.addEventListener('click', () => {
        redirectToAndDrawPage('node', nodeId)
    })
    parent.appendChild(el)

    const { imgSrc, text } = node.preview
    if (imgSrc) {
      await drawImage(imgSrc, el)
    }
    if (text) {
      drawText(text, el)
    }
  }

  const drawNode = async (nodeId) => {
    const node = appData.nodes.find((n) => n.id === nodeId)
    if (!node || !node.isPublished || !node.content) {
      console.warn('Node not found or not published:', nodeId)
      return;
    }

    for (const block of node.content) {
      if (block.type === 'img') {
        await drawImageSizeScreen(block.src, contentWrapper)
      } else if (block.type === 'text') {
        drawText(block.html, contentWrapper, block.size);
      }
    }
  }

  const drawList = async (listId) => {
    const nodes = appData.nodes
        .filter((n) => n.tags?.includes(listId))
        .sort((a, b) => b.raiting - a.raiting)

    if (listId === 'code' || listId === 'design') {
        const viewList = document.createElement('div')
        viewList.classList.add('view-list')
        contentWrapper.appendChild(viewList)
        for (const node of nodes) {
          await drawPreviewNode(node.id, viewList)
        }
    } else {
      for (const node of nodes) {
        let isImg = false
        let isText = false
        if (node.content[0] && node.content[0].type === 'img') {
          await drawImageSizeScreen(node.content[0].src, contentWrapper)
          isImg = true
        }
        if (node.content[1] && node.content[1].type === 'text') {
          drawText(node.content[1].html, contentWrapper)
          isText = true
        }
        if (isImg || isText) drawEmptyLine(contentWrapper, 60)
      }
    }   
  }

  const redrawMainMenu = (listId) => {
    const links = document.querySelectorAll('.nav-item')
    links.forEach((link) => {
        link.id === listId 
            ? link.classList.add('current') 
            : link.classList.remove('current')
    })
  }

  const redirectToAndDrawPage = async (type, id) => {
    clearContent()
    if (type && id) {
      window.history.pushState({ type, id }, '', `?${type}=${id}`)
    }
    if (!type) redrawMainMenu('code')
    // Парсим текущий URL и рисуем нужный контент
    const { nodeId, listId } = parseUrlParams()
    if (nodeId) {
        await drawNode(nodeId)
    } else if (listId) {
        redrawMainMenu(listId)
        await drawList(listId)
    }
  }

  /*********** Основная логика ***********************************************/

  window.addEventListener('popstate', () => {
    redirectToAndDrawPage()
  })

  document.addEventListener('DOMContentLoaded', async () => {
    const links = document.querySelectorAll('.nav-item')
    links.forEach((link) => {
      link.addEventListener('click', () => {
        redirectToAndDrawPage('list', link.id)
      })
    })

    appData = await loadJson('./content.json')

    redirectToAndDrawPage()
  })
})()