// ============================================
// POLICY LIBRARY - Listing Specialist Feature
// ============================================

let policyEditor = null;
let currentPolicy = null;
let policies = [];

// Show admin-only nav items
function showAdminNav() {
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = isAdmin ? '' : 'none';
  });
}

// Initialize Policy Library page
async function initPolicyLibrary() {
  const html = `
    <button class="add-policy-btn" onclick="openPolicyEditor()">+ Add New Policy</button>
    <input type="text" class="policy-search" placeholder="Search policies..." oninput="filterPolicies(this.value)">
    <div class="policy-grid" id="policyGrid"></div>
  `;
  $('page-listing-specialist').innerHTML = html;
  await loadPolicies();
}

// Load all policies from Supabase
async function loadPolicies() {
  const { data, error } = await sb
    .from('policy_library')
    .select('*')
    .order('updated_at', { ascending: false });
  
  if (error) {
    console.error('Error loading policies:', error);
    return;
  }
  
  policies = data || [];
  renderPolicies(policies);
}

// Render policy grid
function renderPolicies(policiesToRender) {
  const grid = $('policyGrid');
  if (!grid) return;
  
  if (policiesToRender.length === 0) {
    grid.innerHTML = `
      <div style="text-align:center;padding:60px 20px;color:var(--text-dim)">
        <div style="font-size:48px;margin-bottom:16px">📋</div>
        <div style="font-size:14px;font-weight:600;margin-bottom:8px">No policies yet</div>
        <div style="font-size:12px">Click "Add New Policy" to create your first policy letter</div>
      </div>
    `;
    return;
  }
  
  let html = '';
  policiesToRender.forEach(policy => {
    const date = new Date(policy.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    html += `
      <div class="policy-card" onclick="openPolicyEditor('${policy.id}')">
        <div class="policy-title">${policy.title || 'Untitled Policy'}</div>
        <div class="policy-meta">
          <span class="policy-date">${date}</span>
          <span class="policy-status-badge ${policy.status}">${policy.status}</span>
        </div>
      </div>
    `;
  });
  
  grid.innerHTML = html;
}

// Filter policies by search term
function filterPolicies(term) {
  const filtered = policies.filter(p => 
    p.title.toLowerCase().includes(term.toLowerCase()) ||
    p.content.toLowerCase().includes(term.toLowerCase())
  );
  renderPolicies(filtered);
}

// Open policy editor (new or existing)
async function openPolicyEditor(policyId = null) {
  currentPolicy = null;
  
  if (policyId) {
    // Load existing policy
    const policy = policies.find(p => p.id === policyId);
    if (policy) {
      currentPolicy = policy;
      $('policyTitleInput').value = policy.title || '';
      setPolicyStatus(policy.status || 'draft');
    }
  } else {
    // New policy
    $('policyTitleInput').value = '';
    setPolicyStatus('draft');
  }
  
  // Show editor
  $('policyEditor').classList.add('active');
  
  // Initialize TipTap editor
  initTipTapEditor(currentPolicy ? currentPolicy.content : '');
}

// Close policy editor
function closePolicyEditor() {
  $('policyEditor').classList.remove('active');
  if (policyEditor) {
    policyEditor.destroy();
    policyEditor = null;
  }
}

// Set policy status (draft/final)
function setPolicyStatus(status) {
  $('statusDraft').classList.toggle('active', status === 'draft');
  $('statusFinal').classList.toggle('active', status === 'final');
}

// Initialize TipTap rich text editor
function initTipTapEditor(content = '') {
  if (policyEditor) {
    policyEditor.destroy();
  }
  
  const { Editor } = window.Tiptap;
  const { StarterKit } = window.TiptapStarterKit;
  
  policyEditor = new Editor({
    element: $('editorContent'),
    extensions: [StarterKit],
    content: content,
    editorProps: {
      attributes: {
        class: 'ProseMirror'
      }
    }
  });
  
  // Build toolbar
  const toolbar = $('editorToolbar');
  toolbar.innerHTML = `
    <button onclick="policyEditor.chain().focus().toggleBold().run()" title="Bold"><strong>B</strong></button>
    <button onclick="policyEditor.chain().focus().toggleItalic().run()" title="Italic"><em>I</em></button>
    <button onclick="policyEditor.chain().focus().toggleUnderline().run()" title="Underline"><u>U</u></button>
    <button onclick="policyEditor.chain().focus().toggleStrike().run()" title="Strikethrough"><s>S</s></button>
    <div style="width:1px;height:24px;background:var(--border);margin:0 4px"></div>
    <button onclick="policyEditor.chain().focus().toggleHeading({level:1}).run()" title="Heading 1">H1</button>
    <button onclick="policyEditor.chain().focus().toggleHeading({level:2}).run()" title="Heading 2">H2</button>
    <button onclick="policyEditor.chain().focus().toggleHeading({level:3}).run()" title="Heading 3">H3</button>
    <div style="width:1px;height:24px;background:var(--border);margin:0 4px"></div>
    <button onclick="policyEditor.chain().focus().toggleBulletList().run()" title="Bullet List">• List</button>
    <button onclick="policyEditor.chain().focus().toggleOrderedList().run()" title="Numbered List">1. List</button>
    <div style="width:1px;height:24px;background:var(--border);margin:0 4px"></div>
    <button onclick="policyEditor.chain().focus().setTextAlign('left').run()" title="Align Left">⬅</button>
    <button onclick="policyEditor.chain().focus().setTextAlign('center').run()" title="Align Center">↔</button>
    <button onclick="policyEditor.chain().focus().setTextAlign('right').run()" title="Align Right">➡</button>
  `;
}

// Save policy
async function savePolicyEditor() {
  const title = $('policyTitleInput').value.trim();
  if (!title) {
    alert('Please enter a policy title');
    return;
  }
  
  const content = policyEditor.getHTML();
  const status = $('statusFinal').classList.contains('active') ? 'final' : 'draft';
  
  const policyData = {
    title,
    content,
    status,
    created_by: currentUser?.id
  };
  
  let error;
  
  if (currentPolicy) {
    // Update existing
    const { error: updateError } = await sb
      .from('policy_library')
      .update(policyData)
      .eq('id', currentPolicy.id);
    error = updateError;
  } else {
    // Insert new
    const { error: insertError } = await sb
      .from('policy_library')
      .insert([policyData]);
    error = insertError;
  }
  
  if (error) {
    alert('Error saving policy: ' + error.message);
    return;
  }
  
  // Close editor and reload
  closePolicyEditor();
  await loadPolicies();
}

// Export policy to print-ready format (future enhancement)
function exportPolicy(policyId) {
  // TODO: Generate PDF or print-friendly HTML
  window.print();
}
