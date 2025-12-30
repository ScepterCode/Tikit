import { useState } from 'react';

interface AsoEbiTier {
  name: string;
  price: number;
  color: string;
}

interface FoodOption {
  name: string;
  dietaryInfo: string;
}

interface WeddingEventFormProps {
  onSubmit: (data: WeddingEventData) => void;
  initialData?: Partial<WeddingEventData>;
}

export interface WeddingEventData {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  venue: string;
  state: string;
  lga: string;
  latitude: number;
  longitude: number;
  capacity: number;
  tiers: any[];
  images?: string[];
  isHidden?: boolean;
  asoEbiTiers: AsoEbiTier[];
  foodOptions: FoodOption[];
  sprayMoneyEnabled: boolean;
}

export function WeddingEventForm({ onSubmit, initialData }: WeddingEventFormProps) {
  const [formData, setFormData] = useState<Partial<WeddingEventData>>({
    asoEbiTiers: initialData?.asoEbiTiers || [],
    foodOptions: initialData?.foodOptions || [],
    sprayMoneyEnabled: initialData?.sprayMoneyEnabled !== false,
    ...initialData,
  });

  const [newAsoEbiTier, setNewAsoEbiTier] = useState<AsoEbiTier>({
    name: '',
    price: 0,
    color: '',
  });

  const [newFoodOption, setNewFoodOption] = useState<FoodOption>({
    name: '',
    dietaryInfo: '',
  });

  const addAsoEbiTier = () => {
    if (newAsoEbiTier.name && newAsoEbiTier.price > 0 && newAsoEbiTier.color) {
      setFormData({
        ...formData,
        asoEbiTiers: [...(formData.asoEbiTiers || []), newAsoEbiTier],
      });
      setNewAsoEbiTier({ name: '', price: 0, color: '' });
    }
  };

  const removeAsoEbiTier = (index: number) => {
    const updated = [...(formData.asoEbiTiers || [])];
    updated.splice(index, 1);
    setFormData({ ...formData, asoEbiTiers: updated });
  };

  const addFoodOption = () => {
    if (newFoodOption.name) {
      setFormData({
        ...formData,
        foodOptions: [...(formData.foodOptions || []), newFoodOption],
      });
      setNewFoodOption({ name: '', dietaryInfo: '' });
    }
  };

  const removeFoodOption = (index: number) => {
    const updated = [...(formData.foodOptions || [])];
    updated.splice(index, 1);
    setFormData({ ...formData, foodOptions: updated });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title && formData.description && formData.asoEbiTiers && formData.foodOptions) {
      onSubmit(formData as WeddingEventData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Wedding Event Details</h2>
        
        {/* Basic event fields would go here - title, description, dates, etc. */}
        
        {/* Aso-ebi Tiers Section */}
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-3">Aso-ebi Tiers</h3>
          <p className="text-gray-600 mb-4">
            Add different aso-ebi options for your guests with pricing and color information.
          </p>
          
          <div className="space-y-2 mb-4">
            {formData.asoEbiTiers?.map((tier, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                <div className="flex-1">
                  <span className="font-medium">{tier.name}</span>
                  <span className="text-gray-600 ml-2">₦{tier.price.toLocaleString()}</span>
                  <span 
                    className="ml-2 inline-block w-6 h-6 rounded border"
                    style={{ backgroundColor: tier.color }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeAsoEbiTier(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Tier name (e.g., Gold)"
              value={newAsoEbiTier.name}
              onChange={(e) => setNewAsoEbiTier({ ...newAsoEbiTier, name: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <input
              type="number"
              placeholder="Price"
              value={newAsoEbiTier.price || ''}
              onChange={(e) => setNewAsoEbiTier({ ...newAsoEbiTier, price: Number(e.target.value) })}
              className="border rounded px-3 py-2"
            />
            <input
              type="color"
              value={newAsoEbiTier.color}
              onChange={(e) => setNewAsoEbiTier({ ...newAsoEbiTier, color: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <button
              type="button"
              onClick={addAsoEbiTier}
              className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
            >
              Add Tier
            </button>
          </div>
        </div>

        {/* Food Options Section */}
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-3">Food Menu Options</h3>
          <p className="text-gray-600 mb-4">
            Add food options for guests to RSVP with dietary information.
          </p>
          
          <div className="space-y-2 mb-4">
            {formData.foodOptions?.map((option, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                <div className="flex-1">
                  <span className="font-medium">{option.name}</span>
                  {option.dietaryInfo && (
                    <span className="text-gray-600 ml-2 text-sm">({option.dietaryInfo})</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeFoodOption(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Food option (e.g., Jollof Rice)"
              value={newFoodOption.name}
              onChange={(e) => setNewFoodOption({ ...newFoodOption, name: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="Dietary info (e.g., Vegetarian)"
              value={newFoodOption.dietaryInfo}
              onChange={(e) => setNewFoodOption({ ...newFoodOption, dietaryInfo: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <button
              type="button"
              onClick={addFoodOption}
              className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
            >
              Add Option
            </button>
          </div>
        </div>

        {/* Spray Money Feature */}
        <div className="mt-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.sprayMoneyEnabled}
              onChange={(e) => setFormData({ ...formData, sprayMoneyEnabled: e.target.checked })}
              className="w-5 h-5"
            />
            <span className="font-medium">Enable Spray Money Leaderboard</span>
          </label>
          <p className="text-gray-600 text-sm mt-1 ml-7">
            Allow guests to spray money and display a live leaderboard of top contributors.
          </p>
        </div>

        <button
          type="submit"
          className="mt-6 w-full bg-green-600 text-white rounded px-6 py-3 hover:bg-green-700 font-semibold"
        >
          Create Wedding Event
        </button>
      </div>
    </form>
  );
}
