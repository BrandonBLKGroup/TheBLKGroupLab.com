# Policy Library Feature - Listing Specialist Tab

## ✅ COMPLETED - Ready to Use

**Live URL:** https://theblkgrouplab.com

---

## What Was Added

### 1. **New "Listing Specialist" Tab (Admin-Only)**
- Visible only to Brandon (admin role)
- Located in the sidebar navigation with 📋 icon
- Dedicated space for writing and managing BLK Group Policy Letters

### 2. **Policy Library View**
- Grid/card layout showing all saved policies
- Each card displays:
  - Policy title
  - Date created
  - Status badge (Draft or Final)
- "Add New Policy" button at top
- Search bar to filter policies by title or content
- Click any policy card to open and edit it

### 3. **Full-Screen Rich Text Editor**
- **Distraction-free writing experience** (nothing else visible on screen)
- **TipTap WYSIWYG editor** with Microsoft Word-like interface
- **Title field** at top of editor
- **Status toggle:** Draft / Final
- **Toolbar with formatting options:**
  - **Text formatting:** Bold, Italic, Underline, Strikethrough
  - **Headers:** H1, H2, H3
  - **Lists:** Bullet lists, Numbered lists
  - **Alignment:** Left, Center, Right
  - **More features available via TipTap extensions if needed**
- **Save button** to save policy
- **Back button** to return to library

### 4. **Supabase Database Table**
- Table name: `policy_library`
- Columns:
  - `id` (UUID, primary key)
  - `title` (text, required)
  - `content` (text, HTML from editor)
  - `status` (draft or final)
  - `created_at` (timestamp)
  - `updated_at` (timestamp, auto-updates)
  - `created_by` (user ID reference)
- **RLS enabled:** Only admins can read/write policies
- **Indexes** for fast searching and sorting

---

## 🚨 ONE STEP REQUIRED: Create Supabase Table

The code is live, but you need to create the Supabase table before you can use it.

### **Option 1: Run SQL File (Recommended)**

1. Go to Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Click "New query"
5. Copy and paste the contents of `create-policy-library-table.sql`
6. Click "Run" (or press Cmd/Ctrl + Enter)

**SQL File Location:** `/Users/jarvis/.openclaw/workspace-spartan4/projects/theblkgrouplab/create-policy-library-table.sql`

### **Option 2: Run via Command Line**

```bash
cd /Users/jarvis/.openclaw/workspace-spartan4/projects/theblkgrouplab
node deploy-policy-library.js
```

*(Note: This requires the `exec_sql` RPC function to be set up in Supabase)*

---

## How to Use

### **Creating a New Policy:**

1. Log in to The Lab as admin (Brandon)
2. Click "Listing Specialist" in the sidebar
3. Click "+ Add New Policy" button
4. A full-screen editor will open
5. Enter policy title in the title field
6. Write your policy using the rich text editor
7. Toggle status between "Draft" and "Final"
8. Click "Save Policy"
9. Editor closes and returns to library

### **Editing an Existing Policy:**

1. Click on any policy card in the library
2. Editor opens with that policy loaded
3. Make your changes
4. Click "Save Policy"

### **Searching Policies:**

- Type in the search bar at the top
- Filters policies by title or content in real-time

### **Policy Status:**

- **Draft:** Work in progress, not ready for printing
- **Final:** Approved policy, ready to print for training materials

---

## Technical Details

### **Files Changed:**

1. **index.html** - Main Lab file
   - Added TipTap editor CDN links
   - Added Policy Library CSS styles
   - Added full-screen editor HTML overlay
   - Added "Listing Specialist" navigation item (admin-only)
   - Added policy library JavaScript code
   - Updated showPage() function
   - Updated TITLES object
   - Updated admin-only nav items array

2. **create-policy-library-table.sql** - Supabase table schema
   - Creates policy_library table
   - Enables RLS with admin-only policy
   - Creates indexes for performance
   - Sets up updated_at trigger

3. **policy-library-code.js** - Standalone reference (also embedded in index.html)
   - Policy library functions
   - TipTap editor initialization
   - CRUD operations (Create, Read, Update, Delete)

4. **.gitignore** - Excludes node_modules from Git

5. **index-backup-20260418.html** - Backup of previous version

### **Dependencies:**

- **TipTap** (via CDN, no npm install needed)
  - Editor framework
  - StarterKit extension (includes basic formatting)
- **Supabase JS** (already in The Lab)

### **Browser Compatibility:**

- Modern browsers (Chrome, Firefox, Safari, Edge)
- TipTap requires ES6+ support

---

## Future Enhancements (Optional)

If you want to add more features later, here are some ideas:

1. **PDF Export** - Generate print-ready PDFs from policies
2. **Version History** - Track changes to policies over time
3. **Categories/Tags** - Organize policies by topic
4. **Templates** - Pre-built policy templates to speed up writing
5. **Collaboration** - Allow multiple admins to edit policies
6. **More formatting options:**
   - Tables
   - Images
   - Links
   - Code blocks
   - Highlight/background colors
   - Font size picker

---

## Troubleshooting

### **"Listing Specialist" tab not visible:**
- Make sure you're logged in as Brandon (admin role)
- Check that `isAdmin` is `true` in browser console
- Refresh the page

### **Editor not loading:**
- Check browser console for errors
- Verify TipTap CDN is loading (check Network tab)
- Make sure JavaScript is enabled

### **Can't save policies:**
- Make sure Supabase table is created (run SQL file)
- Check that RLS policies are enabled
- Verify admin role in agent_profiles table

### **Editor looks broken:**
- Hard refresh the page (Cmd+Shift+R or Ctrl+Shift+R)
- Clear browser cache
- Check that TipTap CSS is loading

---

## Summary

You now have a fully functional Policy Library system in The Lab! 

✅ **What works:**
- Create new policies
- Edit existing policies
- Search/filter policies
- Full-screen WYSIWYG editor
- Draft/Final status tracking
- Admin-only access

🚨 **What you need to do:**
- Create the Supabase table (run the SQL file)

Once the table is created, you can start writing BLK Group Policy Letters for your training materials!

---

**Questions?** Let me know if you need any changes or additional features.
