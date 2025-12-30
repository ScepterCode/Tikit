import React, { useState } from 'react';

type EventType = 'wedding' | 'crusade' | 'burial' | 'festival' | 'general';

interface EventTemplate {
  type: EventType;
  name: string;
  description: string;
  defaultFields: {
    culturalFeatures?: boolean;
    foodOptions?: boolean;
    asoEbiTiers?: boolean;
    sprayMoney?: boolean;
    condolenceMessages?: boolean;
    donations?: boolean;
  };
}

const EVENT_TEMPLATES: EventTemplate[] = [
  {
    type: 'wedding',
    name: 'Wedding',
    description: 'Traditional Nigerian wedding with aso-ebi, food RSVP, and spray money',
    defaultFields: {
      culturalFeatures: true,
      foodOptions: true,
      asoEbiTiers: true,
      sprayMoney: true,
    },
  },
  {
    type: 'crusade',
    name: 'Crusade/Religious Event',
    description: 'Church crusade, revival, or religious gathering',
    defaultFields: {
      culturalFeatures: false,
    },
  },
  {
    type: 'burial',
    name: 'Burial Ceremony',
    description: 'Burial ceremony with condolence messages and donations',
    defaultFields: {
      culturalFeatures: true,
      condolenceMessages: true,
      donations: true,
    },
  },
  {
    type: 'festival',
    name: 'Festival',
    description: 'Cultural festival, concert, or entertainment event',
    defaultFields: {
      culturalFeatures: false,
    },
  },
  {
    type: 'general',
    name: 'General Event',
    description: 'Any other type of event',
    defaultFields: {
      culturalFeatures: false,
    },
  },
];

interface TicketTier {
  name: string;
  price: number;
  quantity: number;
  description: string;
  benefits: string[];
}

interface AsoEbiTier {
  name: string;
  price: number;
  color: string;
}

interface FoodOption {
  name: string;
  dietaryInfo: string;
}

interface EventFormData {
  title: string;
  description: string;
  eventType: EventType;
  startDate: string;
  endDate: string;
  venue: string;
  state: string;
  lga: string;
  latitude: number;
  longitude: number;
  isHidden: boolean;
  capacity: number;
  tiers: TicketTier[];
  culturalFeatures?: {
    asoEbiTiers?: AsoEbiTier[];
    foodOptions?: FoodOption[];
    sprayMoneyEnabled?: boolean;
    condolenceMessages?: boolean;
    donations?: boolean;
  };
  images: string[];
}

interface EventCreatorProps {
  onSubmit: (data: EventFormData) => Promise<void>;
  onCancel?: () => void;
}

export const EventCreator: React.FC<EventCreatorProps> = ({ onSubmit, onCancel }) => {
  const [step, setStep] = useState<'template' | 'details' | 'tickets' | 'cultural'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<EventTemplate | null>(null);
  const [formData, setFormData] = useState<Partial<EventFormData>>({
    tiers: [],
    images: [],
    isHidden: false,
  });
  const [loading, setLoading] = useState(false);

  const handleTemplateSelect = (template: EventTemplate) => {
    setSelectedTemplate(template);
    setFormData((prev) => ({
      ...prev,
      eventType: template.type,
      culturalFeatures: template.defaultFields.culturalFeatures
        ? {
            asoEbiTiers: template.defaultFields.asoEbiTiers ? [] : undefined,
            foodOptions: template.defaultFields.foodOptions ? [] : undefined,
            sprayMoneyEnabled: template.defaultFields.sprayMoney,
            condolenceMessages: template.defaultFields.condolenceMessages,
            donations: template.defaultFields.donations,
          }
        : undefined,
    }));
    setStep('details');
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('tickets');
  };

  const handleTicketsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTemplate?.defaultFields.culturalFeatures) {
      setStep('cultural');
    } else {
      handleFinalSubmit();
    }
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit(formData as EventFormData);
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTicketTier = () => {
    setFormData((prev) => ({
      ...prev,
      tiers: [
        ...(prev.tiers || []),
        { name: '', price: 0, quantity: 0, description: '', benefits: [] },
      ],
    }));
  };

  const updateTicketTier = (index: number, field: keyof TicketTier, value: any) => {
    setFormData((prev) => ({
      ...prev,
      tiers: prev.tiers?.map((tier, i) =>
        i === index ? { ...tier, [field]: value } : tier
      ),
    }));
  };

  const removeTicketTier = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tiers: prev.tiers?.filter((_, i) => i !== index),
    }));
  };

  const addAsoEbiTier = () => {
    setFormData((prev) => ({
      ...prev,
      culturalFeatures: {
        ...prev.culturalFeatures,
        asoEbiTiers: [
          ...(prev.culturalFeatures?.asoEbiTiers || []),
          { name: '', price: 0, color: '' },
        ],
      },
    }));
  };

  const updateAsoEbiTier = (index: number, field: keyof AsoEbiTier, value: any) => {
    setFormData((prev) => ({
      ...prev,
      culturalFeatures: {
        ...prev.culturalFeatures,
        asoEbiTiers: prev.culturalFeatures?.asoEbiTiers?.map((tier, i) =>
          i === index ? { ...tier, [field]: value } : tier
        ),
      },
    }));
  };

  const addFoodOption = () => {
    setFormData((prev) => ({
      ...prev,
      culturalFeatures: {
        ...prev.culturalFeatures,
        foodOptions: [
          ...(prev.culturalFeatures?.foodOptions || []),
          { name: '', dietaryInfo: '' },
        ],
      },
    }));
  };

  const updateFoodOption = (index: number, field: keyof FoodOption, value: string) => {
    setFormData((prev) => ({
      ...prev,
      culturalFeatures: {
        ...prev.culturalFeatures,
        foodOptions: prev.culturalFeatures?.foodOptions?.map((option, i) =>
          i === index ? { ...option, [field]: value } : option
        ),
      },
    }));
  };

  if (step === 'template') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Create New Event</h2>
        <p className="text-gray-600 mb-8">Choose an event template to get started</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EVENT_TEMPLATES.map((template) => (
            <button
              key={template.type}
              onClick={() => handleTemplateSelect(template)}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
            >
              <h3 className="text-xl font-semibold mb-2">{template.name}</h3>
              <p className="text-gray-600">{template.description}</p>
            </button>
          ))}
        </div>
        
        {onCancel && (
          <button
            onClick={onCancel}
            className="mt-6 px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        )}
      </div>
    );
  }

  if (step === 'details') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Event Details</h2>
        
        <form onSubmit={handleDetailsSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Event Title</label>
            <input
              type="text"
              required
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              required
              rows={4}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="datetime-local"
                required
                value={formData.startDate || ''}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="datetime-local"
                required
                value={formData.endDate || ''}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Venue</label>
            <input
              type="text"
              required
              value={formData.venue || ''}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">State</label>
              <input
                type="text"
                required
                value={formData.state || ''}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">LGA</label>
              <input
                type="text"
                required
                value={formData.lga || ''}
                onChange={(e) => setFormData({ ...formData, lga: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Latitude</label>
              <input
                type="number"
                step="any"
                required
                value={formData.latitude || ''}
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Longitude</label>
              <input
                type="number"
                step="any"
                required
                value={formData.longitude || ''}
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Total Capacity</label>
            <input
              type="number"
              required
              min="1"
              value={formData.capacity || ''}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isHidden"
              checked={formData.isHidden || false}
              onChange={(e) => setFormData({ ...formData, isHidden: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="isHidden" className="text-sm font-medium">
              Make this a hidden/private event (requires access code)
            </label>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setStep('template')}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next: Ticket Tiers
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (step === 'tickets') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Ticket Tiers</h2>
        
        <form onSubmit={handleTicketsSubmit} className="space-y-6">
          {formData.tiers?.map((tier, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Tier {index + 1}</h3>
                <button
                  type="button"
                  onClick={() => removeTicketTier(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tier Name</label>
                  <input
                    type="text"
                    required
                    value={tier.name}
                    onChange={(e) => updateTicketTier(index, 'name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Price (₦)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={tier.price}
                    onChange={(e) => updateTicketTier(index, 'price', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Quantity Available</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={tier.quantity}
                  onChange={(e) => updateTicketTier(index, 'quantity', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  rows={2}
                  value={tier.description}
                  onChange={(e) => updateTicketTier(index, 'description', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addTicketTier}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600"
          >
            + Add Ticket Tier
          </button>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setStep('details')}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {selectedTemplate?.defaultFields.culturalFeatures ? 'Next: Cultural Features' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (step === 'cultural') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Cultural Features</h2>
        
        <form onSubmit={(e) => { e.preventDefault(); handleFinalSubmit(); }} className="space-y-8">
          {selectedTemplate?.defaultFields.asoEbiTiers && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Aso-ebi Tiers</h3>
              
              {formData.culturalFeatures?.asoEbiTiers?.map((tier, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Tier Name</label>
                      <input
                        type="text"
                        required
                        value={tier.name}
                        onChange={(e) => updateAsoEbiTier(index, 'name', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Price (₦)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={tier.price}
                        onChange={(e) => updateAsoEbiTier(index, 'price', parseInt(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Color</label>
                      <input
                        type="text"
                        required
                        value={tier.color}
                        onChange={(e) => updateAsoEbiTier(index, 'color', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addAsoEbiTier}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600"
              >
                + Add Aso-ebi Tier
              </button>
            </div>
          )}

          {selectedTemplate?.defaultFields.foodOptions && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Food Options</h3>
              
              {formData.culturalFeatures?.foodOptions?.map((option, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Food Name</label>
                      <input
                        type="text"
                        required
                        value={option.name}
                        onChange={(e) => updateFoodOption(index, 'name', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Dietary Info</label>
                      <input
                        type="text"
                        value={option.dietaryInfo}
                        onChange={(e) => updateFoodOption(index, 'dietaryInfo', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Vegetarian, Halal"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addFoodOption}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600"
              >
                + Add Food Option
              </button>
            </div>
          )}

          {selectedTemplate?.defaultFields.sprayMoney && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="sprayMoney"
                checked={formData.culturalFeatures?.sprayMoneyEnabled || false}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    culturalFeatures: {
                      ...formData.culturalFeatures,
                      sprayMoneyEnabled: e.target.checked,
                    },
                  })
                }
                className="mr-2"
              />
              <label htmlFor="sprayMoney" className="text-sm font-medium">
                Enable spray money leaderboard
              </label>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setStep('tickets')}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return null;
};
