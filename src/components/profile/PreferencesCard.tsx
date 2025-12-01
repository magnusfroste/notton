import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useProfile, FontSize, SortBy, SortOrder } from '@/hooks/useProfile';
import { FileText, FileCode, Type, ListOrdered } from 'lucide-react';

const fontSizeLabels: Record<FontSize, string> = {
  'small': 'Small',
  'medium': 'Medium',
  'large': 'Large',
  'extra-large': 'Extra Large',
};

const fontSizeValues: FontSize[] = ['small', 'medium', 'large', 'extra-large'];

const sortByLabels: Record<SortBy, string> = {
  'updated': 'Modified Date',
  'created': 'Created Date',
  'title': 'Title',
};

export function PreferencesCard() {
  const { 
    editorMode, 
    showLineNumbers, 
    fontSize, 
    sortBy, 
    sortOrder, 
    updatePreferences 
  } = useProfile();

  const handleEditorModeChange = (value: 'rich' | 'markdown') => {
    updatePreferences.mutate({ editor_mode: value });
  };

  const handleLineNumbersChange = (checked: boolean) => {
    updatePreferences.mutate({ show_line_numbers: checked });
  };

  const handleFontSizeChange = (value: number[]) => {
    const newSize = fontSizeValues[value[0]];
    updatePreferences.mutate({ font_size: newSize });
  };

  const handleSortByChange = (value: SortBy) => {
    updatePreferences.mutate({ sort_by: value });
  };

  const handleSortOrderChange = (value: SortOrder) => {
    updatePreferences.mutate({ sort_order: value });
  };

  const currentFontSizeIndex = fontSizeValues.indexOf(fontSize);

  const getSortOrderLabel = () => {
    if (sortBy === 'title') {
      return sortOrder === 'asc' ? 'A → Z' : 'Z → A';
    }
    return sortOrder === 'desc' ? 'Newest First' : 'Oldest First';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>Customize your editing experience</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Editor Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
            <FileText className="h-4 w-4" />
            Editor
          </div>
          
          <div className="space-y-3">
            <Label>Editor Mode</Label>
            <RadioGroup 
              value={editorMode} 
              onValueChange={handleEditorModeChange}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="rich" id="rich" />
                <Label htmlFor="rich" className="flex items-center gap-2 cursor-pointer font-normal">
                  <FileText className="h-4 w-4" />
                  Rich Text
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="markdown" id="markdown" />
                <Label htmlFor="markdown" className="flex items-center gap-2 cursor-pointer font-normal">
                  <FileCode className="h-4 w-4" />
                  Markdown
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="line-numbers" className="flex items-center gap-2 cursor-pointer">
              Show Line Numbers
              <span className="text-xs text-muted-foreground">(Markdown only)</span>
            </Label>
            <Switch 
              id="line-numbers"
              checked={showLineNumbers}
              onCheckedChange={handleLineNumbersChange}
            />
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Display Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
            <Type className="h-4 w-4" />
            Display
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Font Size</Label>
              <span className="text-sm text-muted-foreground">{fontSizeLabels[fontSize]}</span>
            </div>
            <Slider
              value={[currentFontSizeIndex]}
              onValueChange={handleFontSizeChange}
              max={3}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Small</span>
              <span>Extra Large</span>
            </div>
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Notes List Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
            <ListOrdered className="h-4 w-4" />
            Notes List
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sort By</Label>
              <Select value={sortBy} onValueChange={handleSortByChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated">{sortByLabels.updated}</SelectItem>
                  <SelectItem value="created">{sortByLabels.created}</SelectItem>
                  <SelectItem value="title">{sortByLabels.title}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Sort Direction</Label>
              <Select value={sortOrder} onValueChange={handleSortOrderChange}>
                <SelectTrigger>
                  <SelectValue>{getSortOrderLabel()}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {sortBy === 'title' ? (
                    <>
                      <SelectItem value="asc">A → Z</SelectItem>
                      <SelectItem value="desc">Z → A</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="desc">Newest First</SelectItem>
                      <SelectItem value="asc">Oldest First</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
