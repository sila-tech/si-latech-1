'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CalculationDefaults } from '@/lib/calculator';
import { DEFAULTS } from '@/lib/calculator';

type SettingsCardProps = {
  settings: CalculationDefaults;
  setSettings: React.Dispatch<React.SetStateAction<CalculationDefaults>>;
};

export function SettingsCard({ settings, setSettings }: SettingsCardProps) {
  const handleSettingChange = (
    key: keyof CalculationDefaults,
    value: string
  ) => {
    setSettings((prev) => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Configuration</CardTitle>
        <CardDescription>
          Adjust the default values for calculations.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-x-4 gap-y-6">
        {[
          { key: 'blockLength', label: 'Block Length (m)' },
          { key: 'blockWidth', label: 'Block Width (m)' },
          // The beam spacing is tied to block length in the new logic, so it's hidden.
          // { key: 'beamSpacing', label: 'Beam Spacing (m)' }, 
          { key: 'toppingThickness', label: 'Topping Thickness (m)' },
          { key: 'brcRollWidth', label: 'BRC Roll Width (m)' },
          { key: 'brcRollLength', label: 'BRC Roll Length (m)' },
          { key: 'beamSectionW', label: 'Beam Section W (m)' },
          { key: 'beamSectionH', label: 'Beam Section H (m)' },
        ].map(({ key, label }) => (
          <div className="space-y-2" key={key}>
            <Label htmlFor={key} className="text-sm">
              {label}
            </Label>
            <Input
              id={key}
              type="number"
              value={settings[key as keyof CalculationDefaults]}
              onChange={(e) =>
                handleSettingChange(
                  key as keyof CalculationDefaults,
                  e.target.value
                )
              }
              min="0"
              step="0.01"
              placeholder={String(DEFAULTS[key as keyof CalculationDefaults])}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
