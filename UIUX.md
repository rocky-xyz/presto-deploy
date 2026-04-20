# UI/UX

## Design Goals

Presto is built as a streamlined presentation editor that keeps the core workflow straightforward: sign in, create a deck, edit slides, and preview. The interface avoids unnecessary decoration, relying instead on clear spacing, compact toolbars, predictable dialogs, and fast feedback to keep attention on content creation.

The visual style remains intentionally restrained. A neutral background, dark primary actions, small icon-based controls, and subtle shadows give the product a practical, tool-like feel rather than something overly promotional. Toast messages appear near the top centre so they are visible without interfering with controls in the top-right area.

## Application Structure

The landing page keeps things simple with a short hero message and two clear entry points: create an account or sign in. This reduces friction and guides new users directly into the product.

The dashboard displays the user’s name, a fixed header, and a responsive grid of presentation cards. When no content exists, the empty state provides guidance on what to do next. Creating a new presentation opens a focused modal that only asks for essential inputs: title, description, and thumbnail URL.

The editor is centred around the canvas. On desktop, the slide panel remains visible on the left, while the toolbar and actions stay at the top. This layout supports a natural editing cycle: select a slide, add content, adjust it on the canvas, then preview.

The preview mode removes editing controls entirely and presents slides in a full-screen view. Navigation buttons are styled as dark, circular, semi-transparent elements that fade out when idle, keeping attention on the slides themselves.

## Editor Interactions

Slides can be created, removed, selected, and reordered through the side panel. The current slide is clearly highlighted, and the toggle button reflects whether the panel is open or closed.

Content editing is handled through dedicated dialogs for text, images, videos, and code. Text elements default to centred alignment with a sensible starting size, and their bounding box adjusts based on content length. Other elements use percentage-based sizing, making it easier to control layout relative to the slide.

On the canvas, elements support movement, resizing, editing, deletion, proportional scaling, stretch scaling, and layer management. A contextual menu appears near the selected or hovered element, keeping controls accessible without cluttering the interface.

Background options include solid colours, gradients, and images. Gradient settings expose angle, start colour, and end colour, offering a more intuitive approach than manual CSS input.

Code blocks feature syntax highlighting and a monospace style, helping them stand out from regular text and remain easy to read.

## Responsive Design

The interface adapts across desktop, tablet, and mobile devices. On larger screens, the editor uses a split layout with both the slide panel and canvas visible. On mobile, the canvas maintains its presentation ratio, while a Slides button switches to a full-width panel to avoid overcrowding.

Dialogs are width-constrained, and inputs can shrink within their containers. This prevents long text, URLs, or code from breaking the layout.

The dashboard header remains fixed for consistent navigation during scrolling. On smaller screens, the “New Presentation” action prioritises the plus icon while hiding longer text labels when space is tight.

## Feedback and Error Handling

User actions trigger immediate feedback, including account creation, presentation creation, slide changes, scaling adjustments, and layer updates. Errors from validation or backend responses are shown through toast notifications or inline messages, such as password mismatch warnings during registration.

Destructive actions require confirmation, including deleting presentations. Slide deletion also includes safeguards to prevent removing the last slide, prompting users to delete the entire presentation instead.

## Browser Preview Notes

The interface was tested using headless Chrome at `http://localhost:3000/`. The reviewed flow covered the landing page, registration, dashboard empty state, creating a presentation, desktop editing, adding text and code elements, inserting slides, and the mobile editing and slide navigation layout.
