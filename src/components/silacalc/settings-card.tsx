
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
    { key: 'beamSpacing', label: 'Beam Spacing (m)'},
    { key: 'toppingThickness', label: 'Topping Thickness (m)' },
    { key: 'beamSectionW', label: 'Beam Section W (m)' },
    { key: 'beamSectionH', label: 'Beam Section H (m)' },
    { key: 'wastagePercentage', label: 'Wastage (%)' },
    { key: 'dryVolumeFactor', label: 'Dry Volume Factor'},
  ];

  const lintelSettings = [
    { key: 'lintelHeight', label: 'Lintel Height (m)'},
    { key: 'lintelWidth', label: 'Lintel Width (m)'},
  ];
  
  const timberSettings = [
    { key: 'timber3x2Spacing', label: '3x2 Spacing (m)'},
    { key: 'timber6x1PerimeterMultiplier', label: '6x1 Multiplier'},
    { key: 'propSpacing', label: 'Prop Spacing (m)' },
  ];

  const steelSettings = [
      { key: 'num_longitudinal', label: '# Longitudinal Bars'},
      { key: 'dia_longitudinal', label: 'Longitudinal Ø (mm)'},
      { key: 'dia_stirrup', label: 'Stirrup Ø (mm)'},
      { key: 'stirrup_spacing', label: 'Stirrup Spacing (m)'},
      { key: 'cover', label: 'Concrete Cover (m)'},
      { key: 'hook_length', label: 'Hook Length (m)'},
      { key: 'steel_wastage_pct', label: 'Steel Wastage (%)'},
      { key: 'standard_bar_length', label: 'Std Bar Length (m)'},
  ];

  const densitySettings = [
    { key: 'cementBulkDensity', label: 'Cement Density (kg/m³)' },
    { key: 'sandBulkDensity', label: 'Sand Density (kg/m³)' },
    { key: 'aggregateBulkDensity', label: 'Aggregate Density (kg/m³)' },
    { key: 'cementBagWeight', label: 'Cement Bag Wt (kg)'},
  ];
  
  const concreteRatioSettings = [
    { key: 'concreteMixRatioCement', label: 'Cement' },
    { key: 'concreteMixRatioSand', label: 'Sand' },
    { key: 'concreteMixRatioBallast', label: 'Ballast' },
  ];

  const brcSettings = [
    { key: 'brcRollWidth', label: 'BRC Roll Width (m)' },
    { key: 'brcRollLength', label: 'BRC Roll Length (m)' },
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
          <Label className="text-base font-medium">Lintel Dimensions</Label>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
            {lintelSettings.map(({ key, label }) => (
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
        </div>

        <Separator />

        <div>
            <Label className="text-base font-medium">Lintel Steel</Label>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 mt-2">
                {steelSettings.map(({ key, label }) => (
                    <div className="space-y-2" key={key}>
                        <Label htmlFor={key} className="text-sm">{label}</Label>
                        <Input
                            id={key}
                            type="number"
                            value={settings[key as keyof CalculationDefaults]}
                            onChange={(e) => handleSettingChange(key as keyof CalculationDefaults, e.target.value)}
                            min="0"
                            step={key.includes('dia') || key.includes('num') ? "1" : "0.01"}
                            placeholder={String(DEFAULTS[key as keyof CalculationDefaults])}
                        />
                    </div>
                ))}
            </div>
        </div>

        <Separator />

        <div>
          <Label className="text-base font-medium">Timber & Props</Label>
          <div className="grid grid-cols-3 gap-x-2 mt-2">
            {timberSettings.map(({ key, label }) => (
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

        <Separator />

        <div>
          <Label className="text-base font-medium">Concrete Mix Ratio (by Volume)</Label>
          <p className="text-xs text-muted-foreground mb-2">e.g., 1 part Cement : 2 parts Sand : 4 parts Ballast</p>
          <div className="grid grid-cols-3 gap-x-2">
              {concreteRatioSettings.map(({ key, label }) => (
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

        <Separator />

        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
          {densitySettings.map(({ key, label }) => (
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

        <Separator />
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
          {brcSettings.map(({ key, label }) => (
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
                step="0.1"
                placeholder={String(DEFAULTS[key as keyof CalculationDefaults])}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
