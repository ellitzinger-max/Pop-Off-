import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import axios from 'axios';
import { Loader2, Settings, Users, Filter } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Preferences() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [options, setOptions] = useState({});
  const [preferences, setPreferences] = useState({
    group_size_min: 1,
    group_size_max: 10,
    age_range_min: 18,
    age_range_max: 100,
    preferred_genders: [],
    preferred_ethnicities: [],
    preferred_political_affiliations: [],
    preferred_sexual_orientations: [],
    preferred_income_brackets: [],
    preferred_topics: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [optionsRes, prefsRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/users/preference-options`),
        axios.get(`${BACKEND_URL}/api/users/preferences`, { withCredentials: true })
      ]);
      
      setOptions(optionsRes.data);
      if (Object.keys(prefsRes.data).length > 0) {
        setPreferences(prev => ({ ...prev, ...prefsRes.data }));
      }
    } catch (error) {
      toast.error('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (category, value) => {
    setPreferences(prev => {
      const current = prev[category] || [];
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(
        `${BACKEND_URL}/api/users/preferences`,
        preferences,
        { withCredentials: true }
      );
      toast.success('Preferences saved successfully!');
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 md:px-6 max-w-4xl py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 flex items-center" data-testid="preferences-title">
            <Settings className="mr-3 h-10 w-10 text-primary" />
            Conversation Preferences
          </h1>
          <p className="text-muted-foreground text-lg">
            Customize who you'd like to connect with and chat about
          </p>
        </div>

        <div className="space-y-6">
          {/* Group Size */}
          <Card className="glass-effect" data-testid="group-size-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Group Size Preference
              </CardTitle>
              <CardDescription>
                How many people do you prefer in a conversation?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-semibold mb-4 block">
                  Number of Participants: {preferences.group_size_min} - {preferences.group_size_max} people
                </Label>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Minimum: {preferences.group_size_min}</Label>
                    <Slider
                      value={[preferences.group_size_min]}
                      onValueChange={(val) => setPreferences({...preferences, group_size_min: val[0]})}
                      min={1}
                      max={10}
                      step={1}
                      className="mt-2"
                      data-testid="group-size-min-slider"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Maximum: {preferences.group_size_max}</Label>
                    <Slider
                      value={[preferences.group_size_max]}
                      onValueChange={(val) => setPreferences({...preferences, group_size_max: val[0]})}
                      min={1}
                      max={10}
                      step={1}
                      className="mt-2"
                      data-testid="group-size-max-slider"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Age Range */}
          <Card className="glass-effect" data-testid="age-range-card">
            <CardHeader>
              <CardTitle>Age Range Preference</CardTitle>
              <CardDescription>
                Preferred age range of conversation partners
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label className="text-base font-semibold">
                Age Range: {preferences.age_range_min} - {preferences.age_range_max} years old
              </Label>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Minimum Age: {preferences.age_range_min}</Label>
                  <Slider
                    value={[preferences.age_range_min]}
                    onValueChange={(val) => setPreferences({...preferences, age_range_min: val[0]})}
                    min={18}
                    max={100}
                    step={1}
                    className="mt-2"
                    data-testid="age-min-slider"
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Maximum Age: {preferences.age_range_max}</Label>
                  <Slider
                    value={[preferences.age_range_max]}
                    onValueChange={(val) => setPreferences({...preferences, age_range_max: val[0]})}
                    min={18}
                    max={100}
                    step={1}
                    className="mt-2"
                    data-testid="age-max-slider"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gender */}
          <Card className="glass-effect" data-testid="gender-card">
            <CardHeader>
              <CardTitle>Gender Preferences</CardTitle>
              <CardDescription>
                Select all genders you're open to chatting with (leave empty for no preference)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {options.genders?.map((gender) => (
                  <div key={gender} className="flex items-center space-x-2">
                    <Checkbox
                      id={`gender-${gender}`}
                      checked={preferences.preferred_genders?.includes(gender)}
                      onCheckedChange={() => handleCheckboxChange('preferred_genders', gender)}
                      data-testid={`gender-${gender.toLowerCase().replace(/\s+/g, '-')}`}
                    />
                    <Label htmlFor={`gender-${gender}`} className="cursor-pointer">{gender}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ethnicity */}
          <Card className="glass-effect" data-testid="ethnicity-card">
            <CardHeader>
              <CardTitle>Ethnicity Preferences</CardTitle>
              <CardDescription>
                Select all ethnicities you're open to chatting with (leave empty for no preference)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {options.ethnicities?.map((ethnicity) => (
                  <div key={ethnicity} className="flex items-center space-x-2">
                    <Checkbox
                      id={`ethnicity-${ethnicity}`}
                      checked={preferences.preferred_ethnicities?.includes(ethnicity)}
                      onCheckedChange={() => handleCheckboxChange('preferred_ethnicities', ethnicity)}
                      data-testid={`ethnicity-${ethnicity.toLowerCase().replace(/\s+/g, '-')}`}
                    />
                    <Label htmlFor={`ethnicity-${ethnicity}`} className="cursor-pointer">{ethnicity}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Political Affiliation */}
          <Card className="glass-effect" data-testid="political-card">
            <CardHeader>
              <CardTitle>Political Affiliation Preferences</CardTitle>
              <CardDescription>
                Select political views you're comfortable discussing with (leave empty for no preference)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {options.political_affiliations?.map((affiliation) => (
                  <div key={affiliation} className="flex items-center space-x-2">
                    <Checkbox
                      id={`political-${affiliation}`}
                      checked={preferences.preferred_political_affiliations?.includes(affiliation)}
                      onCheckedChange={() => handleCheckboxChange('preferred_political_affiliations', affiliation)}
                      data-testid={`political-${affiliation.toLowerCase().replace(/\s+/g, '-')}`}
                    />
                    <Label htmlFor={`political-${affiliation}`} className="cursor-pointer">{affiliation}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sexual Orientation */}
          <Card className="glass-effect" data-testid="orientation-card">
            <CardHeader>
              <CardTitle>Sexual Orientation Preferences</CardTitle>
              <CardDescription>
                Select orientations you're open to chatting with (leave empty for no preference)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {options.sexual_orientations?.map((orientation) => (
                  <div key={orientation} className="flex items-center space-x-2">
                    <Checkbox
                      id={`orientation-${orientation}`}
                      checked={preferences.preferred_sexual_orientations?.includes(orientation)}
                      onCheckedChange={() => handleCheckboxChange('preferred_sexual_orientations', orientation)}
                      data-testid={`orientation-${orientation.toLowerCase().replace(/\s+/g, '-')}`}
                    />
                    <Label htmlFor={`orientation-${orientation}`} className="cursor-pointer">{orientation}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Income Bracket */}
          <Card className="glass-effect" data-testid="income-card">
            <CardHeader>
              <CardTitle>Income Bracket Preferences</CardTitle>
              <CardDescription>
                Select income brackets you're open to chatting with (leave empty for no preference)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {options.income_brackets?.map((bracket) => (
                  <div key={bracket} className="flex items-center space-x-2">
                    <Checkbox
                      id={`income-${bracket}`}
                      checked={preferences.preferred_income_brackets?.includes(bracket)}
                      onCheckedChange={() => handleCheckboxChange('preferred_income_brackets', bracket)}
                      data-testid={`income-${bracket.toLowerCase().replace(/\s+/g, '-')}`}
                    />
                    <Label htmlFor={`income-${bracket}`} className="cursor-pointer">{bracket}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Topics */}
          <Card className="glass-effect" data-testid="topics-card">
            <CardHeader>
              <CardTitle>Preferred Topics</CardTitle>
              <CardDescription>
                Select topics you're interested in discussing (leave empty for no preference)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {options.topics?.map((topic) => (
                  <div key={topic} className="flex items-center space-x-2">
                    <Checkbox
                      id={`topic-${topic}`}
                      checked={preferences.preferred_topics?.includes(topic)}
                      onCheckedChange={() => handleCheckboxChange('preferred_topics', topic)}
                      data-testid={`topic-${topic.toLowerCase().replace(/\s+/g, '-')}`}
                    />
                    <Label htmlFor={`topic-${topic}`} className="cursor-pointer">{topic}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-4 pt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary px-8 py-6 text-lg rounded-full"
              data-testid="save-preferences-btn"
            >
              {saving ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Saving...</>
              ) : (
                <>Save Preferences</>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
