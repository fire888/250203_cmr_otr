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

  const drawImage = async (src, wrapper) => {
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
    p.style.height = 'auto'
    p.style.alignContent = 'left'
    p.style.padding = '0 20px'

    // Выравниваем ширину под основную сторону
    if (minKey === 'w') {
      p.style.width = (w - OFFSET_W) + 'px'
    } else {
      p.style.width = (h - OFFSET_W) + 'px'
    }

    wrapper.appendChild(p)
  }

  /*********** Рисование элементов *******************************************/

  const drawPreviewNode = async (nodeId) => {
    const node = appData.nodes.find((n) => n.id === nodeId)
    if (!node || !node.isPublished) return;

    const el = document.createElement('div')
    el.classList.add('view-list-item')
    el.addEventListener('click', () => {
        redirectToAndDrawPage('node', nodeId)
      });
    contentWrapper.appendChild(el)

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
        await drawImage(block.src, contentWrapper)
      } else if (block.type === 'text') {
        drawText(block.html, contentWrapper, block.size);
      }
    }
  }

  const drawList = async (listId) => {
    const nodes = appData.nodes
        .filter((n) => n.tags?.includes(listId))
        .sort((a, b) => b.raiting - a.raiting)
    for (const node of nodes) {
      await drawPreviewNode(node.id)
    }
  }

  const reDrawMainMenu = (listId) => {
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
    if (!type) reDrawMainMenu('code')
    // Парсим текущий URL и рисуем нужный контент
    const { nodeId, listId } = parseUrlParams()
    if (nodeId) {
        await drawNode(nodeId)
    } else if (listId) {
        reDrawMainMenu(listId)
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