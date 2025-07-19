// Portfolio functionality
let projects = JSON.parse(localStorage.getItem("portfolioProjects")) || []
let blogPosts = JSON.parse(localStorage.getItem("blogPosts")) || []
const comments = JSON.parse(localStorage.getItem("portfolioComments")) || []
let personalInfo = JSON.parse(localStorage.getItem("personalInfo")) || {
  name: "Your Name",
  email: "michaellote1@gmail.com",
  phone: "+1 (234) 567-890",
  location: "Your City, Country",
  github: "yourusername",
  linkedin: "yourusername",
  twitter: "yourusername",
  calendly: "yourname",
}
let editingProjectId = null
let editingBlogId = null
let selectedTags = []
let selectedBlogTags = []
let activeFilter = "all"
let fabMenuOpen = false
let currentEditor = "write"

// FAB Menu functionality
function toggleFabMenu() {
  const fab = document.getElementById("fab")
  const fabMenu = document.getElementById("fabMenu")

  fabMenuOpen = !fabMenuOpen

  if (fabMenuOpen) {
    fab.classList.add("rotate")
    fabMenu.classList.add("active")
    fab.innerHTML = "×"
  } else {
    fab.classList.remove("rotate")
    fabMenu.classList.remove("active")
    fab.innerHTML = "+"
  }
}

function closeFabMenu() {
  const fab = document.getElementById("fab")
  const fabMenu = document.getElementById("fabMenu")

  fabMenuOpen = false
  fab.classList.remove("rotate")
  fabMenu.classList.remove("active")
  fab.innerHTML = "+"
}

// Close FAB menu when clicking outside
document.addEventListener("click", (event) => {
  const fab = document.getElementById("fab")
  const fabMenu = document.getElementById("fabMenu")

  if (!fab.contains(event.target) && !fabMenu.contains(event.target) && fabMenuOpen) {
    closeFabMenu()
  }
})

// Mobile menu functionality
function toggleMobileMenu() {
  const hamburger = document.getElementById("hamburger")
  const mobileNav = document.getElementById("mobileNav")

  hamburger.classList.toggle("active")
  mobileNav.classList.toggle("active")
}

function closeMobileMenu() {
  const hamburger = document.getElementById("hamburger")
  const mobileNav = document.getElementById("mobileNav")

  hamburger.classList.remove("active")
  mobileNav.classList.remove("active")
}

// Close mobile menu when clicking outside
document.addEventListener("click", (event) => {
  const hamburger = document.getElementById("hamburger")
  const mobileNav = document.getElementById("mobileNav")
  const header = document.querySelector("header")

  if (!header.contains(event.target) && mobileNav.classList.contains("active")) {
    closeMobileMenu()
  }
})

// Initialize the portfolio
function init() {
  displayProjects()
  displayCategoryFilters()
  displayBlogPosts()
  displayComments()
  updateFooterYear()
  loadPersonalInfo()
  setupBlogSearch()
  initNewsletter()
}

// Blog functionality
function setupBlogSearch() {
  const searchInput = document.getElementById("blogSearch")
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const searchTerm = this.value.toLowerCase()
      filterBlogPosts(searchTerm)
    })
  }
}

function filterBlogPosts(searchTerm = "") {
  const filteredPosts = blogPosts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchTerm) ||
      post.excerpt.toLowerCase().includes(searchTerm) ||
      post.content.toLowerCase().includes(searchTerm) ||
      (post.tags && post.tags.some((tag) => tag.toLowerCase().includes(searchTerm))),
  )
  displayBlogPosts(filteredPosts)
}

// UPDATED: Show edit/delete buttons for articles in the main blog list
function displayBlogPosts(postsToShow = blogPosts) {
  const container = document.getElementById("blogContainer")

  // Filter to show only published posts for public view
  const publishedPosts = postsToShow.filter((post) => post.status === "published")

  if (publishedPosts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h2>Coming Soon</h2>
        <p>I'm working on some exciting articles! Check back soon for insights about web development, technology, and my journey as a developer.</p>
      </div>
    `
    return
  }

  const blogHTML = publishedPosts
    .map(
      (post) => `
    <div class="blog-card">
      <h3 class="blog-title">${escapeHtml(post.title)}</h3>
      <div class="blog-meta">
        <span class="blog-date">${formatDate(post.date)}</span>
        <span class="blog-read-time">${calculateReadTime(post.content)} min read</span>
      </div>
      ${
        post.tags && post.tags.length > 0
          ? `
        <div class="blog-tags">
          ${post.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
        </div>
      `
          : ""
      }
      <div class="blog-excerpt">${escapeHtml(post.excerpt)}</div>
      <div class="blog-actions" style="margin-top: 1rem;">
        <button class="btn btn-secondary btn-small" onclick="editBlogPost('${post.id}')">Edit</button>
        <button class="btn btn-danger btn-small" onclick="deleteBlogPost('${post.id}')">Delete</button>
        <button class="btn btn-outline btn-small" onclick="viewPublicBlogPost('${post.id}')">View</button>
      </div>
    </div>
  `,
    )
    .join("")

  container.innerHTML = `<div class="blog-grid">${blogHTML}</div>`
}

function calculateReadTime(content) {
  const wordsPerMinute = 200
  const wordCount = content.split(/\s+/).length
  return Math.ceil(wordCount / wordsPerMinute)
}

function openBlogModal(blogId = null) {
  const modal = document.getElementById("blogModal")
  const modalTitle = document.getElementById("blogModalTitle")
  const titleInput = document.getElementById("blogTitle")
  const excerptInput = document.getElementById("blogExcerpt")
  const contentInput = document.getElementById("blogContent")
  const statusSelect = document.getElementById("blogStatus")

  if (blogId) {
    // Editing existing blog post
    const post = blogPosts.find((p) => p.id === blogId)
    if (post) {
      modalTitle.textContent = "Edit Article"
      titleInput.value = post.title
      excerptInput.value = post.excerpt
      contentInput.value = post.content
      statusSelect.value = post.status || "published"
      selectedBlogTags = [...(post.tags || [])]
      editingBlogId = blogId
    }
  } else {
    // Creating new blog post
    modalTitle.textContent = "Write New Article"
    titleInput.value = ""
    excerptInput.value = ""
    contentInput.value = ""
    statusSelect.value = "draft"
    selectedBlogTags = []
    editingBlogId = null
  }

  updateBlogSubmitButton()
  updateSelectedBlogTagsDisplay()
  setupEnhancedEditor()
  modal.style.display = "block"
  titleInput.focus()
}

function setupEnhancedEditor() {
  const contentInput = document.getElementById("blogContent")

  // Update preview when content changes
  if (contentInput) {
    contentInput.addEventListener("input", updatePreview)
    // Initial preview update
    updatePreview()
  }
}

function updatePreview() {
  const content = document.getElementById("blogContent")?.value || ""
  const previewContainer = document.getElementById("editorPreview")
  if (previewContainer) {
    previewContainer.innerHTML = formatBlogContent(content)
  }
}

function switchEditorTab(tab) {
  currentEditor = tab

  // Update tab buttons
  document.querySelectorAll(".editor-tab").forEach((btn) => {
    btn.classList.remove("active")
  })
  const activeTab = document.querySelector(`[onclick="switchEditorTab('${tab}')"]`)
  if (activeTab) {
    activeTab.classList.add("active")
  }

  // Update content panes
  document.querySelectorAll(".editor-pane").forEach((pane) => {
    pane.classList.remove("active")
  })
  const activePane = document.getElementById(`editor-${tab}`)
  if (activePane) {
    activePane.classList.add("active")
  }

  if (tab === "preview") {
    updatePreview()
  }
}

// Enhanced formatting functions
function insertFormatting(type) {
  const textarea = document.getElementById("blogContent")
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = textarea.value.substring(start, end)
  let replacement = ""

  switch (type) {
    case "bold":
      replacement = `**${selectedText || "bold text"}**`
      break
    case "italic":
      replacement = `*${selectedText || "italic text"}*`
      break
    case "heading":
      replacement = `## ${selectedText || "Heading"}`
      break
    case "link":
      const url = prompt("Enter URL:") || "https://example.com"
      replacement = `[${selectedText || "link text"}](${url})`
      break
    case "image":
      const imageUrl = prompt("Enter image URL:") || "https://example.com/image.jpg"
      replacement = `![${selectedText || "image description"}](${imageUrl})`
      break
    case "code":
      replacement = selectedText.includes("\n")
        ? `\`\`\`\n${selectedText || "code block"}\n\`\`\``
        : `\`${selectedText || "code"}\``
      break
    case "quote":
      replacement = `> ${selectedText || "quote"}`
      break
    case "list":
      replacement = `- ${selectedText || "list item"}`
      break
  }

  textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end)
  textarea.focus()

  // Update cursor position
  const newPos = start + replacement.length
  textarea.setSelectionRange(newPos, newPos)

  updatePreview()
}

// Enhanced content formatting
function formatBlogContent(content) {
  // Enhanced markdown-like formatting
  const formatted = content
    // Headers
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    // Bold and italic
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    // Code blocks
    .replace(/```(.*?)```/gs, "<pre><code>$1</code></pre>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Images
    .replace(/!\[(.*?)\]$$(.*?)$$/g, '<img src="$2" alt="$1" loading="lazy">')
    // Links
    .replace(/\[(.*?)\]$$(.*?)$$/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    // Lists
    .replace(/^- (.*$)/gim, "<li>$1</li>")
    // Blockquotes
    .replace(/^> (.*$)/gim, "<blockquote>$1</blockquote>")
    // Line breaks and paragraphs
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      // Don't wrap already formatted elements
      if (/<(h1|h2|h3|h4|h5|h6|pre|ul|ol|li|blockquote|img|video|div)/.test(line)) {
        return line
      }
      return `<p>${line}</p>`
    })
    .join("\n")

  return formatted
}

function updateBlogSubmitButton() {
  const statusSelect = document.getElementById("blogStatus")
  const submitBtn = document.getElementById("blogSubmitBtn")

  if (statusSelect && submitBtn) {
    if (statusSelect.value === "published") {
      submitBtn.textContent = "Publish Article"
      submitBtn.className = "btn"
    } else {
      submitBtn.textContent = "Save as Draft"
      submitBtn.className = "btn btn-secondary"
    }
  }
}

function closeBlogModal() {
  const modal = document.getElementById("blogModal")
  modal.style.display = "none"
  editingBlogId = null
  selectedBlogTags = []
  const tagsInput = document.getElementById("blogTags")
  if (tagsInput) {
    tagsInput.value = ""
  }
}

function viewBlogPost(blogId) {
  const post = blogPosts.find((p) => p.id === blogId)
  if (!post) return

  const modal = document.getElementById("blogViewModal")
  const content = document.getElementById("blogViewContent")

  content.innerHTML = `
        <div style="margin-bottom: 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                <h1 style="color: #ccd6f6; font-size: 2rem; flex: 1;">${escapeHtml(post.title)}</h1>
                <div class="blog-status ${post.status || "published"}" style="position: static; margin-left: 1rem;">${post.status || "published"}</div>
            </div>
            <div class="blog-meta" style="margin-bottom: 2rem;">
                <span class="blog-date">${formatDate(post.date)}</span>
                <span class="blog-read-time">${calculateReadTime(post.content)} min read</span>
            </div>
            ${
              post.tags && post.tags.length > 0
                ? `
                <div class="blog-tags" style="margin-bottom: 2rem;">
                    ${post.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
                </div>
            `
                : ""
            }
        </div>
        <div class="blog-content">
            ${formatBlogContent(post.content)}
        </div>
        <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid rgba(100, 255, 218, 0.2);">
            <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                <button class="btn btn-secondary" onclick="editBlogPost('${post.id}'); closeBlogViewModal();">Edit Article</button>
                <button class="btn btn-danger" onclick="deleteBlogPost('${post.id}'); closeBlogViewModal();">Delete Article</button>
                ${post.status === "draft" ? `<button class="btn" onclick="publishBlogPost('${post.id}'); closeBlogViewModal();">Publish Article</button>` : ""}
            </div>
        </div>
    `

  modal.style.display = "block"
}

function closeBlogViewModal() {
  const modal = document.getElementById("blogViewModal")
  modal.style.display = "none"
}

function editBlogPost(blogId) {
  openBlogModal(blogId)
}

function publishBlogPost(blogId) {
  const postIndex = blogPosts.findIndex((p) => p.id === blogId)
  if (postIndex === -1) return

  blogPosts[postIndex].status = "published"
  localStorage.setItem("blogPosts", JSON.stringify(blogPosts))
  displayBlogPosts()
  closeBlogViewModal()
}

function deleteBlogPost(blogId) {
  if (confirm("Are you sure you want to delete this article?")) {
    blogPosts = blogPosts.filter((p) => p.id !== blogId)
    localStorage.setItem("blogPosts", JSON.stringify(blogPosts))
    displayBlogPosts()
    closeBlogViewModal()
  }
}

function addBlogTag() {
  const tagInput = document.getElementById("blogTags")
  if (!tagInput) return

  const tag = tagInput.value.trim()

  if (tag && !selectedBlogTags.includes(tag)) {
    selectedBlogTags.push(tag)
    updateSelectedBlogTagsDisplay()
    tagInput.value = ""
  }
}

function removeBlogTag(tagToRemove) {
  selectedBlogTags = selectedBlogTags.filter((tag) => tag !== tagToRemove)
  updateSelectedBlogTagsDisplay()
}

function updateSelectedBlogTagsDisplay() {
  const container = document.getElementById("selectedBlogTags")
  if (!container) return

  container.innerHTML = ""

  if (selectedBlogTags.length === 0) {
    container.innerHTML = '<span style="color: #8892b0; font-size: 0.9rem;">No tags selected</span>'
    return
  }

  selectedBlogTags.forEach((tag) => {
    const tagElement = document.createElement("span")
    tagElement.className = "selected-tag"
    tagElement.innerHTML = `
            ${escapeHtml(tag)}
            <button type="button" class="remove-tag" onclick="removeBlogTag('${escapeHtml(tag)}')">×</button>
        `
    container.appendChild(tagElement)
  })
}

// Project functionality
function displayProjects(filter = activeFilter) {
  const container = document.getElementById("projectsContainer")

  if (projects.length === 0) {
    container.innerHTML = `
            <div class="empty-state">
                <h2>No projects yet</h2>
                <p>Projects will appear here once they're added.</p>
            </div>
        `
    return
  }

  const projectsToShow =
    filter === "all" ? projects : projects.filter((project) => project.tags && project.tags.includes(filter))

  if (projectsToShow.length === 0) {
    container.innerHTML = `
            <div class="empty-state">
                <h2>No projects in this category</h2>
                <p>No projects match the selected category.</p>
            </div>
        `
    return
  }

  const projectsHTML = projectsToShow
    .map(
      (project) => `
        <div class="project-card">
            <h3 class="project-title">${escapeHtml(project.title)}</h3>
            <div class="project-tags">
                ${project.tags ? project.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("") : ""}
            </div>
            <div class="project-content">${escapeHtml(project.content)}</div>
            <div class="project-actions">
                <button class="btn btn-secondary" onclick="editProject('${project.id}')">Edit</button>
                <button class="btn btn-danger" onclick="deleteProject('${project.id}')">Delete</button>
            </div>
        </div>
    `,
    )
    .join("")

  container.innerHTML = `<div class="projects-grid">${projectsHTML}</div>`
}

function openModal(projectId = null) {
  const modal = document.getElementById("projectModal")
  const modalTitle = document.getElementById("modalTitle")
  const titleInput = document.getElementById("projectTitle")
  const contentInput = document.getElementById("projectContent")

  if (projectId) {
    // Editing existing project
    const project = projects.find((p) => p.id === projectId)
    if (project) {
      modalTitle.textContent = "Edit Project"
      titleInput.value = project.title
      contentInput.value = project.content
      selectedTags = [...(project.tags || [])]
      editingProjectId = projectId
    }
  } else {
    // Creating new project
    modalTitle.textContent = "Add New Project"
    titleInput.value = ""
    contentInput.value = ""
    selectedTags = []
    editingProjectId = null
  }

  updateSelectedTagsDisplay()
  modal.style.display = "block"
  titleInput.focus()
}

function closeModal() {
  const modal = document.getElementById("projectModal")
  modal.style.display = "none"
  editingProjectId = null
  selectedTags = []
  const tagsInput = document.getElementById("projectTags")
  if (tagsInput) {
    tagsInput.value = ""
  }
}

function editProject(projectId) {
  openModal(projectId)
}

function deleteProject(projectId) {
  if (confirm("Are you sure you want to delete this project?")) {
    projects = projects.filter((p) => p.id !== projectId)
    localStorage.setItem("portfolioProjects", JSON.stringify(projects))
    displayProjects()
    displayCategoryFilters()
  }
}

function addTag() {
  const tagInput = document.getElementById("projectTags")
  if (!tagInput) return

  const tag = tagInput.value.trim()

  if (tag && !selectedTags.includes(tag)) {
    selectedTags.push(tag)
    updateSelectedTagsDisplay()
    tagInput.value = ""
  }
}

function removeTag(tagToRemove) {
  selectedTags = selectedTags.filter((tag) => tag !== tagToRemove)
  updateSelectedTagsDisplay()
}

function updateSelectedTagsDisplay() {
  const container = document.getElementById("selectedTags")
  if (!container) return

  container.innerHTML = ""

  if (selectedTags.length === 0) {
    container.innerHTML = '<span style="color: #8892b0; font-size: 0.9rem;">No technologies selected</span>'
    return
  }

  selectedTags.forEach((tag) => {
    const tagElement = document.createElement("span")
    tagElement.className = "selected-tag"
    tagElement.innerHTML = `
            ${escapeHtml(tag)}
            <button type="button" class="remove-tag" onclick="removeTag('${escapeHtml(tag)}')">×</button>
        `
    container.appendChild(tagElement)
  })
}

function displayCategoryFilters() {
  const filtersContainer = document.querySelector(".category-filters")
  if (!filtersContainer) return

  filtersContainer.innerHTML = ""

  const allTags = new Set()
  projects.forEach((project) => {
    if (project.tags) {
      project.tags.forEach((tag) => allTags.add(tag))
    }
  })

  const tagsArray = Array.from(allTags)

  // Add "All" filter
  const allFilter = document.createElement("span")
  allFilter.className = `filter-tag ${activeFilter === "all" ? "active" : ""}`
  allFilter.textContent = "All"
  allFilter.onclick = () => {
    activeFilter = "all"
    displayProjects()
    updateFilterStyles()
  }
  filtersContainer.appendChild(allFilter)

  tagsArray.forEach((tag) => {
    const filterTag = document.createElement("span")
    filterTag.className = `filter-tag ${activeFilter === tag ? "active" : ""}`
    filterTag.textContent = tag
    filterTag.onclick = () => {
      activeFilter = tag
      displayProjects(tag)
      updateFilterStyles()
    }
    filtersContainer.appendChild(filterTag)
  })
}

function updateFilterStyles() {
  const filters = document.querySelectorAll(".filter-tag")
  filters.forEach((filter) => {
    filter.classList.remove("active")
    if (filter.textContent === activeFilter || (filter.textContent === "All" && activeFilter === "all")) {
      filter.classList.add("active")
    }
  })
}

// Comments functionality
function displayComments() {
  const container = document.getElementById("commentsList")

  if (comments.length === 0) {
    container.innerHTML =
      '<p style="text-align: center; color: #8892b0; padding: 1rem;">No comments yet. Be the first to share your thoughts!</p>'
    return
  }

  const commentsHTML = comments
    .map(
      (comment) => `
        <div class="comment">
            <div class="comment-header">
                <div class="comment-author">${escapeHtml(comment.name)}</div>
                <div class="comment-date">${formatDate(comment.date)}</div>
            </div>
            <div class="comment-text">${escapeHtml(comment.text)}</div>
        </div>
    `,
    )
    .join("")

  container.innerHTML = commentsHTML
}

function toggleCommentForm() {
  const form = document.getElementById("commentForm")
  form.style.display = form.style.display === "none" ? "block" : "none"
}

// Customization functionality
function toggleCustomization() {
  const modal = document.getElementById("customizationModal")
  modal.style.display = "block"
}

function closeCustomizationModal() {
  const modal = document.getElementById("customizationModal")
  modal.style.display = "none"
}

function loadPersonalInfo() {
  // Load data from localStorage
  personalInfo = JSON.parse(localStorage.getItem("personalInfo")) || personalInfo

  // Update form fields
  const fields = [
    "customName",
    "customEmail",
    "customPhone",
    "customLocation",
    "customGithub",
    "customLinkedin",
    "customTwitter",
    "customCalendly",
  ]
  fields.forEach((field) => {
    const element = document.getElementById(field)
    if (element) {
      const key = field.replace("custom", "").toLowerCase()
      element.value = personalInfo[key] || ""
    }
  })

  // Update website content
  updateWebsiteContent()
}

function updateWebsiteContent() {
  const elements = {
    logoText: personalInfo.name.substring(0, 2).toUpperCase() || "YN",
    heroName: personalInfo.name || "Your Name",
    footerName: personalInfo.name || "Your Name",
    copyrightName: personalInfo.name || "Your Name",
    footerDescription: "Passionate developer creating exceptional digital experiences and turning ideas into reality.",
    footerEmail: personalInfo.email || "your.email@example.com",
    footerPhone: personalInfo.phone || "+1 (234) 567-890",
    footerLocation: personalInfo.location || "Your City, Country",
  }

  Object.entries(elements).forEach(([id, value]) => {
    const element = document.getElementById(id)
    if (element) {
      if (id.includes("Email")) {
        element.textContent = value
        element.href = `mailto:${value}`
      } else if (id.includes("Phone")) {
        element.textContent = value
        element.href = `tel:${value.replace(/\D/g, "")}`
      } else {
        element.textContent = value
      }
    }
  })

  // Update social links
  const socialLinks = {
    githubLink: `https://github.com/${personalInfo.github || "yourusername"}`,
    linkedinLink: `https://linkedin.com/in/${personalInfo.linkedin || "yourusername"}`,
    twitterLink: `https://twitter.com/${personalInfo.twitter || "yourusername"}`,
    footerCalendar: `https://calendly.com/${personalInfo.calendly || "yourname"}`,
    scheduleCallBtn: `https://calendly.com/${personalInfo.calendly || "yourname"}`,
  }

  Object.entries(socialLinks).forEach(([id, href]) => {
    const element = document.getElementById(id)
    if (element) {
      element.href = href
    }
  })
}

// Newsletter functionality
let subscribers = JSON.parse(localStorage.getItem("newsletterSubscribers")) || []

// Initialize newsletter
function initNewsletter() {
  updateSubscriberCount()
  displaySubscribers()
}

function showNewsletterMessage(text, type) {
  const message = document.getElementById("newsletterMessage")
  message.textContent = text
  message.className = `newsletter-message ${type}`
  message.style.display = "block"

  // Hide message after 5 seconds
  setTimeout(() => {
    message.style.display = "none"
  }, 5000)
}

function updateSubscriberCount() {
  const count = subscribers.length
  const subscriberCountEl = document.getElementById("subscriberCount")
  if (subscriberCountEl) {
    subscriberCountEl.textContent = count
  }

  const totalSubscribersEl = document.getElementById("totalSubscribers")
  const recentSubscribersEl = document.getElementById("recentSubscribers")

  if (totalSubscribersEl) {
    totalSubscribersEl.textContent = count

    // Calculate recent subscribers (this month)
    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)

    const recentCount = subscribers.filter((sub) => new Date(sub.date) >= thisMonth).length

    if (recentSubscribersEl) {
      recentSubscribersEl.textContent = recentCount
    }
  }
}

function openNewsletterModal() {
  document.getElementById("newsletterModal").style.display = "block"
  updateSubscriberCount()
  displaySubscribers()
}

function closeNewsletterModal() {
  document.getElementById("newsletterModal").style.display = "none"
}

function displaySubscribers() {
  const container = document.getElementById("subscribersList")

  if (!container) return

  if (subscribers.length === 0) {
    container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #8892b0;">
                <p>No subscribers yet. Share your newsletter signup to start building your audience!</p>
            </div>
        `
    return
  }

  const subscribersHTML = subscribers
    .map(
      (subscriber) => `
        <div class="subscriber-item">
            <div class="subscriber-info">
                <div class="subscriber-email">${escapeHtml(subscriber.email)}</div>
                <div class="subscriber-date">Subscribed ${formatDate(subscriber.date)}</div>
            </div>
            <div class="subscriber-actions">
                <button class="btn btn-danger btn-small" onclick="removeSubscriber('${subscriber.id}')">
                    Remove
                </button>
            </div>
        </div>
    `,
    )
    .join("")

  container.innerHTML = subscribersHTML
}

function removeSubscriber(subscriberId) {
  if (confirm("Are you sure you want to remove this subscriber?")) {
    subscribers = subscribers.filter((sub) => sub.id !== subscriberId)
    localStorage.setItem("newsletterSubscribers", JSON.stringify(subscribers))
    updateSubscriberCount()
    displaySubscribers()
  }
}

function exportSubscribers() {
  if (subscribers.length === 0) {
    alert("No subscribers to export.")
    return
  }

  // Create CSV content
  const csvContent = [
    ["Email", "Subscription Date", "Status"],
    ...subscribers.map((sub) => [sub.email, formatDate(sub.date), sub.status || "active"]),
  ]
    .map((row) => row.join(","))
    .join("\n")

  // Create and download file
  const blob = new Blob([csvContent], { type: "text/csv" })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `newsletter-subscribers-${new Date().toISOString().split("T")[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

// Helper functions
function generateId() {
  return "_" + Math.random().toString(36).substr(2, 9)
}

function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const options = { year: "numeric", month: "long", day: "numeric" }
  return date.toLocaleDateString(undefined, options)
}

function updateFooterYear() {
  const yearEl = document.getElementById("currentYear")
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear()
  }
}

// Article comments storage
const articleComments = JSON.parse(localStorage.getItem("articleComments")) || {}

function displayArticleComments(articleId) {
  const comments = articleComments[articleId] || []

  if (comments.length === 0) {
    return '<p style="text-align: center; color: #8892b0; padding: 2rem;">No comments yet. Be the first to share your thoughts on this article!</p>'
  }

  return comments
    .map(
      (comment) => `
    <div class="comment">
      <div class="comment-header">
        <div class="comment-author">${escapeHtml(comment.name)}</div>
        <div class="comment-date">${formatDate(comment.date)}</div>
      </div>
      <div class="comment-text">${escapeHtml(comment.text)}</div>
    </div>
  `,
    )
    .join("")
}

function toggleArticleCommentForm(articleId) {
  const form = document.getElementById(`articleCommentForm-${articleId}`)
  form.style.display = form.style.display === "none" ? "block" : "none"
}

function submitArticleComment(event, articleId) {
  event.preventDefault()

  const name = document.getElementById(`articleCommentName-${articleId}`).value.trim()
  const email = document.getElementById(`articleCommentEmail-${articleId}`).value.trim()
  const text = document.getElementById(`articleCommentText-${articleId}`).value.trim()

  if (!name || !text) {
    alert("Please enter your name and comment.")
    return
  }

  const newComment = {
    id: generateId(),
    name: name,
    email: email,
    text: text,
    date: new Date().toISOString(),
    articleId: articleId,
  }

  if (!articleComments[articleId]) {
    articleComments[articleId] = []
  }

  articleComments[articleId].unshift(newComment)
  localStorage.setItem("articleComments", JSON.stringify(articleComments))

  // Update the comments display
  const commentsList = document.getElementById(`articleCommentsList-${articleId}`)
  if (commentsList) {
    commentsList.innerHTML = displayArticleComments(articleId)
  }

  // Reset form
  document.getElementById(`articleCommentName-${articleId}`).value = ""
  document.getElementById(`articleCommentEmail-${articleId}`).value = ""
  document.getElementById(`articleCommentText-${articleId}`).value = ""
  toggleArticleCommentForm(articleId)

  // Show success message
  alert("Thank you for your comment! It has been posted successfully.")
}

function viewPublicBlogPost(blogId) {
  const post = blogPosts.find((p) => p.id === blogId)
  if (!post || post.status !== "published") return

  const modal = document.getElementById("blogViewModal")
  const content = document.getElementById("blogViewContent")

  content.innerHTML = `
    <div style="margin-bottom: 2rem;">
      <h1 style="color: #ccd6f6; font-size: 2rem; margin-bottom: 1rem;">${escapeHtml(post.title)}</h1>
      <div class="blog-meta" style="margin-bottom: 2rem;">
        <span class="blog-date">${formatDate(post.date)}</span>
        <span class="blog-read-time">${calculateReadTime(post.content)} min read</span>
      </div>
      ${
        post.tags && post.tags.length > 0
          ? `
        <div class="blog-tags" style="margin-bottom: 2rem;">
          ${post.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
        </div>
      `
          : ""
      }
    </div>
    <div class="blog-content">
      ${formatBlogContent(post.content)}
    </div>
    
    <!-- Article Comments Section -->
    <div class="article-comments-section" style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid rgba(100, 255, 218, 0.2);">
      <div class="comments-header" style="margin-bottom: 2rem;">
        <h3 style="color: #ccd6f6; font-size: 1.5rem; margin-bottom: 1rem;">Comments</h3>
        <button class="btn btn-small" onclick="toggleArticleCommentForm('${post.id}')">Leave a Comment</button>
      </div>

      <div id="articleCommentForm-${post.id}" class="comment-form" style="display: none;">
        <h4>Share your thoughts on this article</h4>
        <form onsubmit="submitArticleComment(event, '${post.id}')">
          <div class="comment-meta">
            <input type="text" id="articleCommentName-${post.id}" placeholder="Your Name" required>
            <input type="email" id="articleCommentEmail-${post.id}" placeholder="Your Email (optional)">
          </div>
          <textarea id="articleCommentText-${post.id}" class="comment-input" placeholder="What did you think about this article? Share your insights, questions, or feedback!" required></textarea>
          <div style="display: flex; gap: 1rem;">
            <button type="submit" class="btn btn-small">Post Comment</button>
            <button type="button" class="btn btn-secondary btn-small" onclick="toggleArticleCommentForm('${post.id}')">Cancel</button>
          </div>
        </form>
      </div>

      <div id="articleCommentsList-${post.id}" class="comments-list">
        ${displayArticleComments(post.id)}
      </div>
    </div>
  `

  modal.style.display = "block"
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  // Initialize the portfolio
  init()
  // Update submit button when status changes
  const blogStatusSelect = document.getElementById("blogStatus")
  if (blogStatusSelect) {
    blogStatusSelect.addEventListener("change", updateBlogSubmitButton)
  }

  // Blog form submission
  const blogForm = document.getElementById("blogForm")
  if (blogForm) {
    blogForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const title = document.getElementById("blogTitle").value.trim()
      const excerpt = document.getElementById("blogExcerpt").value.trim()
      const content = document.getElementById("blogContent").value.trim()
      const status = document.getElementById("blogStatus").value

      if (!title || !excerpt || !content) {
        alert("Please fill in all fields.")
        return
      }

      if (editingBlogId) {
        // Update existing blog post
        const postIndex = blogPosts.findIndex((p) => p.id === editingBlogId)
        if (postIndex !== -1) {
          blogPosts[postIndex].title = title
          blogPosts[postIndex].excerpt = excerpt
          blogPosts[postIndex].content = content
          blogPosts[postIndex].date = new Date().toISOString()
          blogPosts[postIndex].status = status
          blogPosts[postIndex].tags = [...selectedBlogTags]
        }
      } else {
        // Create new blog post
        const newPost = {
          id: generateId(),
          title: title,
          excerpt: excerpt,
          content: content,
          date: new Date().toISOString(),
          status: status,
          tags: [...selectedBlogTags],
        }
        blogPosts.unshift(newPost)
      }

      localStorage.setItem("blogPosts", JSON.stringify(blogPosts))
      displayBlogPosts()
      closeBlogModal()

      // Show success message
      alert(status === "published" ? "Article published successfully!" : "Article saved as draft!")
    })
  }

  // Project form submission
  const projectForm = document.getElementById("projectForm")
  if (projectForm) {
    projectForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const title = document.getElementById("projectTitle").value.trim()
      const content = document.getElementById("projectContent").value.trim()

      if (!title || !content) {
        alert("Please fill in all fields.")
        return
      }

      if (editingProjectId) {
        // Update existing project
        const projectIndex = projects.findIndex((p) => p.id === editingProjectId)
        if (projectIndex !== -1) {
          projects[projectIndex].title = title
          projects[projectIndex].content = content
          projects[projectIndex].tags = [...selectedTags]
        }
      } else {
        // Create new project
        const newProject = {
          id: generateId(),
          title: title,
          content: content,
          tags: [...selectedTags],
        }
        projects.push(newProject)
      }

      localStorage.setItem("portfolioProjects", JSON.stringify(projects))
      displayProjects()
      displayCategoryFilters()
      closeModal()
    })
  }

  // Visitor comment form submission
  const visitorCommentForm = document.getElementById("visitorCommentForm")
  if (visitorCommentForm) {
    visitorCommentForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const name = document.getElementById("commentName").value.trim()
      const email = document.getElementById("commentEmail").value.trim()
      const text = document.getElementById("commentText").value.trim()

      if (!name || !text) {
        alert("Please enter your name and comment.")
        return
      }

      const newComment = {
        id: generateId(),
        name: name,
        email: email,
        text: text,
        date: new Date().toISOString(),
      }

      comments.unshift(newComment)
      localStorage.setItem("portfolioComments", JSON.stringify(comments))
      displayComments()
      closeCommentForm()

      // Show success message
      alert("Thank you for your comment! It has been posted successfully.")
    })
  }

  // Show FAB only for you
  const fab = document.getElementById("fab");
  const fabMenu = document.getElementById("fabMenu");
  const myEmail = "michaellote1@gmail.com"; // <-- Use your real email

  // Make sure personalInfo is loaded before this check!
  personalInfo = JSON.parse(localStorage.getItem("personalInfo")) || personalInfo;

  if (personalInfo.email === myEmail) {
    fab.style.display = "inline-flex";
    fabMenu.style.display = "block";
  } else {
    fab.style.display = "none";
    fabMenu.style.display = "none";
  }
})