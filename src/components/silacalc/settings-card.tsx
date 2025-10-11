
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
import { Separator } from '../ui/separator';

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

  const basicSettings = [
    { key: 'blockLength', label: 'Block Length (m)' },
    { key: 'blockWidth', label: 'Block Width (m)' },
    { key: 'toppingThickness', label: 'Topping Thickness (m)' },
    { key: 'brcRollWidth', label: 'BRC Roll Width (m)' },
    { key: 'brcRollLength', label: 'BRC Roll Length (m)' },
    { key: 'beamSectionW', label: 'Beam Section W (m)' },
    { key: 'beamSectionH', label: 'Beam Section H (m)' },
    { key: 'wastagePercentage', label: 'Wastage (%)' },
  ];

  const concreteSettings = [
    { key: 'concreteUnitWeight', label: 'Concrete Weight (kg/m³)'},
    { key: 'cementBagWeight', label: 'Cement Bag Wt (kg)'},
    { key: 'sandDensity', label: 'Sand Density (kg/m³)'},
    { key: 'ballastDensity', label: 'Ballast Density (kg/m³)'},
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Configuration</CardTitle>
        <CardDescription>
          Adjust the default values for calculations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
          {basicSettings.map(({ key, label }) => (
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
        </div>

        <Separator />

        <div>
          <Label className="text-base font-medium">Concrete Mix Ratio</Label>
          <div className="grid grid-cols-3 gap-x-2 mt-2">
              {[
                { key: 'concreteMixRatioCement', label: 'Cement' },
                { key: 'concreteMixRatioSand', label: 'Sand' },
                { key: 'concreteMixRatioBallast', label: 'Ballast' },
              ].map(({ key, label }) => (
                <div className="space-y-2" key={key}>
                  <Label htmlFor={key} className="text-sm font-normal text-muted-foreground">{label}</Label>
                  <Input
                    id={key}
                    type="number"
                    value={settings[key as keyof CalculationDefaults]}
                    onChange={(e) => handleSettingChange(key as keyof CalculationDefaults, e.target.value)}
                    min="0"
                    step="0.1"
                    placeholder={String(DEFAULTS[key as keyof CalculationDefaults])}
                  />
                </div>
              ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
          {concreteSettings.map(({ key, label }) => (
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
                step="1"
                placeholder={String(DEFAULTS[key as keyof CalculationDefaults])}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
