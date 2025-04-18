
declare const chrome: any

chrome.runtime.onMessage.addListener((message: any) => {
  if (message.action === "detectForm") {
    detectFormFields()
  }
})

interface FormField {
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  type: string
  name: string
  id: string
  label: string
}

function detectFormFields() {
  const inputs = Array.from(
    document.querySelectorAll(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"])',
    ),
  )
  const textareas = Array.from(document.querySelectorAll("textarea"))
  const selects = Array.from(document.querySelectorAll("select"))

  const allFields = [...inputs, ...textareas, ...selects] as (
    | HTMLInputElement
    | HTMLTextAreaElement
    | HTMLSelectElement
  )[]

  const formFields: FormField[] = allFields.map((element) => {
    let label = ""

    if (element.id) {
      const labelElement = document.querySelector(`label[for="${element.id}"]`)
      if (labelElement) {
        label = labelElement.textContent?.trim() || ""
      }
    }

    if (!label && element.parentElement?.tagName.toLowerCase() === "label") {
      label = element.parentElement.textContent?.trim() || ""
    }

    if (!label) {
      label = ('placeholder' in element ? element.placeholder : '') || element.name || element.id || ""
    }

    return {
      element,
      type: (element as HTMLInputElement).type || element.tagName.toLowerCase(),
      name: element.name,
      id: element.id,
      label,
    }
  })

  highlightFields(formFields)

  chrome.runtime.sendMessage({
    action: "formFieldsDetected",
    fields: formFields.map((field) => ({
      type: field.type,
      name: field.name,
      id: field.id,
      label: field.label,
    })),
  })
}

function highlightFields(fields: FormField[]) {
  const existingHighlights = document.querySelectorAll(".quicklinks-field-highlight")
  existingHighlights.forEach((el) => el.remove())

  fields.forEach((field) => {
    const rect = field.element.getBoundingClientRect()
    const highlight = document.createElement("div")
    highlight.className = "quicklinks-field-highlight"
    highlight.style.position = "absolute"
    highlight.style.left = `${window.scrollX + rect.left - 5}px`
    highlight.style.top = `${window.scrollY + rect.top - 5}px`
    highlight.style.width = `${rect.width + 10}px`
    highlight.style.height = `${rect.height + 10}px`
    highlight.style.border = "2px solid #4CAF50"
    highlight.style.borderRadius = "4px"
    highlight.style.pointerEvents = "none"
    highlight.style.zIndex = "9998"
    highlight.style.boxSizing = "border-box"

    // Add label
    const labelEl = document.createElement("div")
    labelEl.textContent = field.label || field.type
    labelEl.style.position = "absolute"
    labelEl.style.top = "-24px"
    labelEl.style.left = "0"
    labelEl.style.backgroundColor = "#4CAF50"
    labelEl.style.color = "white"
    labelEl.style.padding = "2px 6px"
    labelEl.style.borderRadius = "4px"
    labelEl.style.fontSize = "12px"
    highlight.appendChild(labelEl)

    document.body.appendChild(highlight)

    setTimeout(() => {
      highlight.remove()
    }, 3000)
  })
}

export {}
