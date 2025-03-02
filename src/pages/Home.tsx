import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Upload, Fish, Loader2 } from 'lucide-react';
import { analyzeImage } from '../lib/gemini';
import SupportBlock from '../components/SupportBlock';

// Default fish image path
const DEFAULT_IMAGE = "/default-fish.jpg";

// Default analysis for the fish
const DEFAULT_ANALYSIS = `1. Fish Identification:
- Name: Clownfish (Amphiprioninae)
- Scientific Classification: Family Pomacentridae (damselfish)
- Appearance: Bright orange with white vertical stripes and black outlines
- Size: 3-4 inches (7-10 cm) in length
- Distinguishing Features: Three white bars on body, black outlines on fins

2. Habitat & Distribution:
- Natural Habitat: Coral reefs in warm waters
- Geographic Range: Indo-Pacific region, Red Sea to Western Pacific
- Depth Range: Typically 3-50 feet (1-15 meters)
- Water Temperature: 75-82°F (24-28°C)
- Association: Lives symbiotically with sea anemones

3. Biology & Behavior:
- Lifespan: 6-10 years in the wild
- Diet: Omnivorous (algae, zooplankton, small invertebrates)
- Reproduction: Sequential hermaphrodites (males can become females)
- Social Structure: Lives in small groups with dominant breeding pair
- Interesting Behavior: Immune to anemone stings due to protective mucus

4. Conservation & Aquarium Care:
- Conservation Status: Not endangered, but habitat threatened by coral bleaching
- Aquarium Suitability: Popular for home aquariums, relatively hardy
- Tank Requirements: Minimum 20 gallons, reef setup with anemone preferred
- Diet in Captivity: Commercial fish food, frozen foods, occasional algae
- Special Needs: Requires stable water parameters, benefits from anemone host

5. Additional Information:
- Cultural Significance: Popularized by the film "Finding Nemo"
- Similar Species: Other anemonefish species (30+ species in the genus)
- Interesting Facts: Can change sex from male to female when dominant female dies
- Commercial Importance: Significant value in ornamental fish trade
- Ecological Role: Helps keep anemones clean and protects them from predators`;

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load default image and analysis without API call
    const loadDefaultContent = async () => {
      try {
        setLoading(true);
        const response = await fetch(DEFAULT_IMAGE);
        if (!response.ok) {
          throw new Error('Failed to load default image');
        }
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setImage(base64data);
          setAnalysis(DEFAULT_ANALYSIS);
          setLoading(false);
        };
        reader.onerror = () => {
          setError('Failed to load default image');
          setLoading(false);
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error('Error loading default image:', err);
        setError('Failed to load default image');
        setLoading(false);
      }
    };

    loadDefaultContent();
  }, []);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError('Image size should be less than 20MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImage(base64String);
      setError(null);
      handleAnalyze(base64String);
    };
    reader.onerror = () => {
      setError('Failed to read the image file. Please try again.');
    };
    reader.readAsDataURL(file);

    // Reset the file input so the same file can be selected again
    e.target.value = '';
  }, []);

  const handleAnalyze = async (imageData: string) => {
    setLoading(true);
    setError(null);
    const fishPrompt = "Analyze this fish image for educational purposes and provide the following information:\n1. Fish identification (name, scientific classification, appearance, size, distinguishing features)\n2. Habitat and distribution (natural habitat, geographic range, depth range, water temperature)\n3. Biology and behavior (lifespan, diet, reproduction, social structure, interesting behaviors)\n4. Conservation status and aquarium care (if applicable)\n5. Additional information (cultural significance, similar species, interesting facts)\n\nIMPORTANT: This is for educational purposes only.";
    try {
      const result = await analyzeImage(imageData, fishPrompt);
      setAnalysis(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze image. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const formatAnalysis = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Remove any markdown-style formatting
      const cleanLine = line.replace(/[*_#`]/g, '').trim();
      if (!cleanLine) return null;

      // Format section headers (lines starting with numbers)
      if (/^\d+\./.test(cleanLine)) {
        return (
          <div key={index} className="mt-8 first:mt-0">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {cleanLine.replace(/^\d+\.\s*/, '')}
            </h3>
          </div>
        );
      }
      
      // Format list items with specific properties
      if (cleanLine.startsWith('-') && cleanLine.includes(':')) {
        const [label, ...valueParts] = cleanLine.substring(1).split(':');
        const value = valueParts.join(':').trim();
        return (
          <div key={index} className="flex gap-2 mb-3 ml-4">
            <span className="font-semibold text-gray-800 min-w-[120px]">{label.trim()}:</span>
            <span className="text-gray-700">{value}</span>
          </div>
        );
      }
      
      // Format regular list items
      if (cleanLine.startsWith('-')) {
        return (
          <div key={index} className="flex gap-2 mb-3 ml-4">
            <span className="text-gray-400">•</span>
            <span className="text-gray-700">{cleanLine.substring(1).trim()}</span>
          </div>
        );
      }

      // Regular text
      return (
        <p key={index} className="mb-3 text-gray-700">
          {cleanLine}
        </p>
      );
    }).filter(Boolean);
  };

  return (
    <div className="bg-gray-50 py-6 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Free Fish Identifier</h1>
          <p className="text-base sm:text-lg text-gray-600">Upload a fish photo for educational identification and aquatic information</p>
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-12">
          <div className="flex flex-col items-center justify-center mb-6">
            <label 
              htmlFor="image-upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer w-full sm:w-auto"
            >
              <Upload className="h-5 w-5" />
              Upload Fish Photo
              <input
                ref={fileInputRef}
                id="image-upload"
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                onChange={handleImageUpload}
              />
            </label>
            <p className="mt-2 text-sm text-gray-500">PNG, JPG, JPEG or WEBP (MAX. 20MB)</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {loading && !image && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          )}

          {image && (
            <div className="mb-6">
              <div className="relative rounded-lg mb-4 overflow-hidden bg-gray-100">
                <img
                  src={image}
                  alt="Fish preview"
                  className="w-full h-auto max-h-[500px] object-contain mx-auto"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleAnalyze(image)}
                  disabled={loading}
                  className="flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Fish className="-ml-1 mr-2 h-5 w-5" />
                      Identify Fish
                    </>
                  )}
                </button>
                <button
                  onClick={triggerFileInput}
                  className="flex items-center justify-center px-4 py-2 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Another Photo
                </button>
              </div>
            </div>
          )}

          {analysis && (
            <div className="bg-gray-50 rounded-lg p-6 sm:p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Fish Analysis Results</h2>
              <div className="text-gray-700">
                {formatAnalysis(analysis)}
              </div>
            </div>
          )}
        </div>

        <SupportBlock />

        <div className="prose max-w-none my-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">Free Fish Identifier: Your Educational Guide to Aquatic Species</h2>
          
          <p>Welcome to our free fish identifier tool, powered by advanced artificial intelligence technology.
             This educational tool helps you learn about different fish species, their habitats, and
             essential information about their biological characteristics and conservation status.</p>

          <h3>How Our Educational Fish Identifier Works</h3>
          <p>Our tool uses AI to analyze fish photos and provide educational information about species
             identification, habitat details, and biological attributes. Simply upload a clear photo of a fish,
             and our AI will help you learn about its type and characteristics.</p>

          <h3>Key Features of Our Fish Identifier</h3>
          <ul>
            <li>Educational marine biology information</li>
            <li>Detailed habitat and distribution data</li>
            <li>Biology and behavior insights</li>
            <li>Conservation status information</li>
            <li>Aquarium care guidelines (when applicable)</li>
            <li>100% free to use</li>
          </ul>

          <h3>Perfect For Learning About:</h3>
          <ul>
            <li>Freshwater and saltwater fish identification</li>
            <li>Marine biology and aquatic ecosystems</li>
            <li>Fish behavior and reproduction</li>
            <li>Conservation status and environmental concerns</li>
            <li>Aquarium care requirements for different species</li>
          </ul>

          <p>Try our free fish identifier today and expand your knowledge of aquatic life!
             No registration required - just upload a photo and start learning about fascinating fish species from around the world.</p>
        </div>

        <SupportBlock />
      </div>
    </div>
  );
}