import { useState } from 'react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router';
import { authenticatedFetch } from '../../utils/auth';

export function CreateEvent() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    category: 'conference',
    enableLivestream: false,
  });
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [ticketTiers, setTicketTiers] = useState([
    { name: 'General Admission', price: '', quantity: '' }
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if auth is still loading
    if (loading) {
      alert('Please wait, authentication is loading...');
      return;
    }
    
    // Check if user is authenticated
    if (!user) {
      alert('You must be logged in to create events');
      navigate('/auth/login');
      return;
    }
    
    // Validate ticket tiers
    const validTiers = ticketTiers.filter(tier => tier.name && tier.price && tier.quantity);
    if (validTiers.length === 0) {
      alert('Please add at least one ticket tier');
      return;
    }
    
    try {
      // Prepare event data with ticket tiers
      const eventData = {
        ...formData,
        ticketTiers: validTiers.map(tier => ({
          name: tier.name,
          price: parseFloat(tier.price),
          quantity: parseInt(tier.quantity),
          sold: 0
        })),
        images: imagePreviews, // Base64 encoded images
      };
      
      console.log('🔍 Creating event with data:', eventData);
      
      // Call API to create event
      const response = await authenticatedFetch('http://localhost:8000/api/events', {
        method: 'POST',
        body: JSON.stringify(eventData)
      });
      
      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        alert(`Failed to create event: ${response.status} ${response.statusText}`);
        return;
      }
      
      const data = await response.json();
      console.log('🔍 Response data:', data);
      
      if (data.success) {
        alert('Event created successfully!');
        navigate('/organizer/events');
      } else {
        alert(`Failed to create event: ${data.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error creating event:', error);
      if (error instanceof Error) {
        alert(`Failed to create event: ${error.message}`);
      } else {
        alert('Failed to create event. Please try again.');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 3) {
      alert('Maximum 3 images allowed');
      return;
    }

    setImages(prev => [...prev, ...files].slice(0, 3));

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string].slice(0, 3));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const addTicketTier = () => {
    if (ticketTiers.length >= 5) {
      alert('Maximum 5 ticket tiers allowed');
      return;
    }
    setTicketTiers(prev => [...prev, { name: '', price: '', quantity: '' }]);
  };

  const removeTicketTier = (index: number) => {
    if (ticketTiers.length === 1) {
      alert('At least one ticket tier is required');
      return;
    }
    setTicketTiers(prev => prev.filter((_, i) => i !== index));
  };

  const updateTicketTier = (index: number, field: string, value: string) => {
    setTicketTiers(prev => prev.map((tier, i) => 
      i === index ? { ...tier, [field]: value } : tier
    ));
  };

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <h2>Loading...</h2>
          <p>Initializing authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    navigate('/auth/login');
    return null;
  }

  return (
    <div style={styles.container}>
      {/* Top Bar */}
      <header style={styles.header}>
        <h1 style={styles.logo}>Grooovy</h1>
        <div style={styles.userMenu}>
          <span style={styles.userName}>{user?.organizationName || user?.firstName}</span>
          <button onClick={() => signOut()} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      <div style={styles.layout}>
        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <nav style={styles.nav}>
            <NavItem icon="📊" label="Dashboard" onClick={() => navigate('/organizer/dashboard')} />
            <NavItem icon="🎉" label="My Events" onClick={() => navigate('/organizer/events')} />
            <NavItem icon="➕" label="Create Event" active />
            <NavItem icon="👥" label="Attendees" onClick={() => navigate('/organizer/attendees')} />
            <NavItem icon="💰" label="Financials" onClick={() => navigate('/organizer/financials')} />
            <NavItem icon="📢" label="Broadcast" onClick={() => navigate('/organizer/broadcast')} />
            <NavItem icon="📱" label="Scanner" onClick={() => navigate('/organizer/scanner')} />
            <NavItem icon="⚙️" label="Settings" onClick={() => navigate('/organizer/settings')} />
          </nav>
        </aside>

        {/* Main Content */}
        <main style={styles.main}>
          <div style={styles.titleRow}>
            <div>
              <h2 style={styles.pageTitle}>Create Event</h2>
              <p style={styles.pageSubtitle}>
                Set up a new event and start selling tickets
              </p>
            </div>
          </div>

          {/* Event Form */}
          <div style={styles.formContainer}>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Event Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="Enter event title"
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    style={styles.select}
                    required
                  >
                    <option value="conference">Conference</option>
                    <option value="workshop">Workshop</option>
                    <option value="concert">Concert</option>
                    <option value="party">Party</option>
                    <option value="wedding">Wedding</option>
                    <option value="sports">Sports</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Time *</label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    style={styles.input}
                    required
                  />
                </div>

              </div>

              {/* Event Images */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Event Images (Max 3)</label>
                <div style={styles.imageUploadSection}>
                  {imagePreviews.map((preview, index) => (
                    <div key={index} style={styles.imagePreview}>
                      <img src={preview} alt={`Preview ${index + 1}`} style={styles.previewImage} />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        style={styles.removeImageButton}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {images.length < 3 && (
                    <label style={styles.imageUploadBox}>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        style={styles.fileInput}
                      />
                      <div style={styles.uploadPlaceholder}>
                        <span style={styles.uploadIcon}>📷</span>
                        <span style={styles.uploadText}>Add Image</span>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {/* Ticket Tiers */}
              <div style={styles.formGroup}>
                <div style={styles.tierHeader}>
                  <label style={styles.label}>Ticket Tiers *</label>
                  <button
                    type="button"
                    onClick={addTicketTier}
                    style={styles.addTierButton}
                  >
                    + Add Tier
                  </button>
                </div>
                {ticketTiers.map((tier, index) => (
                  <div key={index} style={styles.tierRow}>
                    <input
                      type="text"
                      placeholder="Tier name (e.g., VIP, Regular)"
                      value={tier.name}
                      onChange={(e) => updateTicketTier(index, 'name', e.target.value)}
                      style={{...styles.input, flex: 2}}
                    />
                    <input
                      type="number"
                      placeholder="Price (₦)"
                      value={tier.price}
                      onChange={(e) => updateTicketTier(index, 'price', e.target.value)}
                      style={{...styles.input, flex: 1}}
                      min="0"
                    />
                    <input
                      type="number"
                      placeholder="Quantity"
                      value={tier.quantity}
                      onChange={(e) => updateTicketTier(index, 'quantity', e.target.value)}
                      style={{...styles.input, flex: 1}}
                      min="1"
                    />
                    {ticketTiers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTicketTier(index)}
                        style={styles.removeTierButton}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Venue *</label>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Enter venue address"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  style={styles.textarea}
                  placeholder="Describe your event..."
                  rows={4}
                  required
                />
              </div>

              {/* Livestream Option */}
              <div style={styles.formGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="enableLivestream"
                    checked={formData.enableLivestream}
                    onChange={handleChange}
                    style={styles.checkbox}
                  />
                  <span>Enable Livestream & Spray Money</span>
                </label>
                <p style={styles.helperText}>
                  Allow attendees to watch your event live and spray money virtually
                </p>
              </div>

              <div style={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={() => navigate('/organizer/events')}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
                <button type="submit" style={styles.submitButton}>
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      style={{
        ...styles.navItem,
        ...(active ? styles.navItemActive : {}),
      }}
      onClick={onClick}
    >
      <span style={styles.navIcon}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e5e7eb',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#667eea',
    margin: 0,
  },
  userMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userName: {
    fontSize: '14px',
    color: '#374151',
    fontWeight: '500',
  },
  logoutButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#f3f4f6',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#374151',
  },
  layout: {
    display: 'flex',
  },
  sidebar: {
    width: '240px',
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e5e7eb',
    minHeight: 'calc(100vh - 65px)',
    padding: '24px 0',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    padding: '0 12px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    fontSize: '14px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#6b7280',
    textAlign: 'left' as const,
    transition: 'all 0.2s',
  },
  navItemActive: {
    backgroundColor: '#f5f7ff',
    color: '#667eea',
    fontWeight: '500',
  },
  navIcon: {
    fontSize: '18px',
  },
  main: {
    flex: 1,
    padding: '32px',
    maxWidth: '1200px',
  },
  titleRow: {
    marginBottom: '24px',
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '4px',
  },
  pageSubtitle: {
    fontSize: '14px',
    color: '#6b7280',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  form: {
    maxWidth: '800px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box' as const,
  },
  select: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const,
  },
  imageUploadSection: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const,
  },
  imagePreview: {
    position: 'relative' as const,
    width: '120px',
    height: '120px',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '2px solid #e5e7eb',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  removeImageButton: {
    position: 'absolute' as const,
    top: '4px',
    right: '4px',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  imageUploadBox: {
    width: '120px',
    height: '120px',
    border: '2px dashed #d1d5db',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backgroundColor: '#f9fafb',
  },
  fileInput: {
    display: 'none',
  },
  uploadPlaceholder: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
  },
  uploadIcon: {
    fontSize: '32px',
  },
  uploadText: {
    fontSize: '12px',
    color: '#6b7280',
  },
  tierHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  addTierButton: {
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: '500',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  tierRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px',
    alignItems: 'center',
  },
  removeTierButton: {
    padding: '8px 12px',
    fontSize: '14px',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    cursor: 'pointer',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  helperText: {
    fontSize: '13px',
    color: '#6b7280',
    marginTop: '4px',
    marginLeft: '26px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '32px',
  },
  cancelButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  submitButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};
