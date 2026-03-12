# C58 — CMS Guide

Your website content is managed through **Sanity Studio**, a simple editing interface. This guide covers everything you need to keep the site up to date.

---

## Contents

- [Accessing the Studio](#accessing-the-studio)
- [Site Settings](#site-settings)
- [Events](#events)
- [Pages](#pages)
  - [Page Builder Blocks](#page-builder-blocks)
- [Team Members](#team-members)

---

## Accessing the Studio

The Studio is available at your Sanity project URL (provided separately). Log in with your Sanity account. You'll land on the Studio dashboard.

The left-hand sidebar lists the main content types: **Pages**, **Events**, **Team Members**, and **Site Settings**.

---

## Site Settings

> **Site Settings** contains global information that appears across the whole site. There is only one — you edit it, you do not create new ones.

To open it: click **Site Settings** in the sidebar.

### Fields

| Field | What it controls |
|---|---|
| **Phone** | Phone number shown in the Contact section |
| **Email** | Email address shown in the Contact section |
| **Address** | Address shown in the Contact section |
| **Navigation Links** | The links in the site's top navigation bar |

### Managing navigation links

To add a link: click **Add item** under Navigation Links, enter a **Label** (the text that appears in the nav), then select the **Page** it should link to.

To reorder: drag items by the handle on the left.

To remove: click the item, then the bin icon.

> The navigation only supports links to pages within the site. External links are not currently supported.

---

## Events

> Each event appears in the **Event List** section of any page that includes one. The **Next Event** section automatically picks up whichever event is nearest in the future.

### Creating an event

1. Click **Events** in the sidebar
2. Click **New event** (top right)
3. Fill in the fields (see below)
4. Click **Publish** when ready

### Fields

| Field | Required | Notes |
|---|---|---|
| **Title** | Yes | The event name |
| **Slug** | Yes | The web address for this event — click **Generate** and it's created from the title automatically |
| **Date** | Yes | Used to determine upcoming vs. past events |
| **Time** | No | Free text, e.g. `9pm – late` |
| **Location** | No | Venue name or address |
| **Cost** | No | Free text, e.g. `£10 advance / £15 on the door` |
| **Image** | No | Shown in event listings. Use the hotspot tool to control the crop focus |
| **Description** | No | Rich text — supports headings, bold, links |

### Editing an existing event

Click the event in the list, make your changes, then click **Publish**. Changes only go live once published.

### Past events

Events with a past date remain in the system and appear in the **Past** tab of the Event List. You don't need to delete them.

---

## Pages

> Pages are the individual sections of the site (e.g. Home, About). Each page is built from **blocks** — reusable content sections stacked in order.

### Editing a page

1. Click **Pages** in the sidebar
2. Click the page you want to edit
3. Scroll to **Page Builder** to add, remove, or reorder blocks
4. Click **Publish** to push changes live

### Page fields

| Field | Notes |
|---|---|
| **Title** | The page name — also used in the browser tab |
| **Slug** | The web address for this page — click **Generate** and it's created from the title automatically. e.g. a page titled `About` gets the address `/about` |
| **SEO** | Optional — controls how the page appears in Google and when shared on social media (see below) |
| **Page Builder** | The blocks that make up the page content |

### SEO fields

Expand the **SEO** section to control search and social appearance:

| Field | Ideal length | Notes |
|---|---|---|
| **Meta Title** | 50–60 characters | Overrides the page title in Google results. Useful when the page title alone isn't descriptive enough — e.g. a page titled `Home` could have a meta title of `C58 — St Neots Underground Nights` |
| **Meta Description** | 150–160 characters | The description shown under the link in Google. e.g. `C58 brings underground dance music to St Neots. Check our upcoming events, meet the team, and find out how to get involved.` |
| **Social Share Image** | 1200×630px | Shown when the page is shared on social media |

If left blank, the site falls back to the page title and sensible defaults.

---

### Page Builder Blocks

Blocks are the building units of each page. You can add as many as you need, in any order. Click **Add block** at the bottom of the Page Builder to choose one.

---

#### Hero

A full-width banner at the top of a page, with optional background image or video and overlaid text.

| Field | Notes |
|---|---|
| **Background Media** | Choose **Image** or **Video**. For image, upload and set a hotspot. For video, paste in a URL |
| **Overlay Text** | Short text displayed over the background |

---

#### Next Event

Automatically displays the nearest upcoming event — no configuration needed. Just add the block and it pulls the next event from your Events list.

If there are no upcoming events, this block displays nothing.

---

#### Event List

Displays all events with **Upcoming** and **Past** tabs. No configuration — it pulls everything from your Events list automatically.

---

#### Rich Text

A free-form text area. Supports:

- Headings (H2, H3)
- Bold
- Bullet and numbered lists
- Hyperlinks

Use this for any body copy, announcements, or general information.

---

#### Team

Displays all published **Team Members** in a grid. No configuration — it pulls from the Team Members list automatically.

---

#### Contact

Displays the contact details from **Site Settings** (phone, email, address).

| Field | Notes |
|---|---|
| **Show Map Embed** | Toggle on to include a Google Maps embed of the address |

> Make sure Site Settings has up-to-date contact details before using this block.

---

#### Image

A standalone full-width image.

| Field | Notes |
|---|---|
| **Image** | Upload an image. Hotspot is enabled — drag the circle to set the crop focus |
| **Alt Text** | Describe the image for accessibility and SEO. e.g. `DJ performing at C58 night, crowd visible in the background` — used by screen readers and search engines |
| **Caption** | Optional caption displayed below the image |

---

## Team Members

> Team Members are displayed by the **Team** block on any page that includes one.

### Adding a team member

1. Click **Team Members** in the sidebar
2. Click **New Team Member**
3. Fill in the fields
4. Click **Publish**

### Fields

| Field | Notes |
|---|---|
| **Name** | Required |
| **Role** | e.g. `Resident DJ`, `Events Director` |
| **Bio** | Short description — plain text |
| **Photo** | Use the hotspot tool to control how the image is cropped |

### Ordering

Team members appear on the site in the order they were published. If the team is small, the simplest way to reorder is to delete the existing members and re-add them in the desired order. For larger teams, get in touch and a developer can sort it.

---

## Tips

- **Draft vs Published** — changes are saved automatically as drafts. Nothing goes live until you click **Publish**.
- **Unpublishing** — to temporarily hide content without deleting it, click the menu next to Publish and choose **Unpublish**.
- **Deleting** — avoid deleting events or pages unless you are certain. Unpublishing is usually safer.
- **Images** — use the **hotspot** tool (the circle you can drag around the image) to tell the site which part of the image is most important, so it crops correctly on different screen sizes.
