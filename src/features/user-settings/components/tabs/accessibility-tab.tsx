import React, { useState } from 'react';
import {
  SlidersHorizontal, Check, Info, ChevronDown, ChevronRight, Palette, Play
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';
import { playPreviewSound } from '../../utils/sound-preview';
import { AccessibilityPreview } from './accessibility/accessibility-preview';
import { AccessibilityReducedMotion } from './accessibility/accessibility-reduced-motion';

export interface AccessibilityTabProps {
  theme?: any;
  onNavigateSection?: (section: string) => void;
  currentUser?: any;
  currentUserName?: string;
}

export function AccessibilityTab({
  theme,
  onNavigateSection,
  currentUser,
  currentUserName,
}: AccessibilityTabProps) {
  const { t } = useTranslation();
  const [showUserAvatars, setShowUserAvatars] = useState(true);
  // ==========================================
  // ACCESSIBILITY STATES (Discord Parity)
  // ==========================================
  // Text Readability
  const [chatFontSize, setChatFontSize] = useState<number>(16);
  const [alwaysUnderlineLinks, setAlwaysUnderlineLinks] = useState(false);
  const [displayNameStyles, setDisplayNameStyles] = useState(true);

  // Visual Density
  const [uiDensity, setUiDensity] = useState<'compact' | 'default' | 'spacious'>('default');
  const [chatMessageDisplay, setChatMessageDisplay] = useState<'default' | 'compact'>('default');
  const [spaceMessageGroups, setSpaceMessageGroups] = useState<number>(16);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Color & Contrast
  const [saturationLevel, setSaturationLevel] = useState<number>(100);
  const [applySaturationCustomColors, setApplySaturationCustomColors] = useState(false);
  const [enableHighContrast, setEnableHighContrast] = useState(false);
  const [syncContrastSettings, setSyncContrastSettings] = useState(true);
  const [roleColorsDisplay, setRoleColorsDisplay] = useState<'names' | 'dot' | 'none'>('names');
  const [officialMessagesStyle, setOfficialMessagesStyle] = useState<'default' | 'contrast' | 'plain'>('default');
  const [showOnOffIndicators, setShowOnOffIndicators] = useState(false);

  // Reduced Motion
  const [enableReducedMotion, setEnableReducedMotion] = useState(false);
  const [syncReducedMotionComputer, setSyncReducedMotionComputer] = useState(true);
  const [notificationDuration, setNotificationDuration] = useState<number>(3);
  const [playGifsFocused, setPlayGifsFocused] = useState(true);
  const [playAnimatedEmoji, setPlayAnimatedEmoji] = useState(true);
  const [stickerAnimationMode, setStickerAnimationMode] = useState<'always' | 'interaction' | 'never'>('always');

  // Audio & Screen Reader
  const [ttsRate, setTtsRate] = useState<number>(1.0);
  const [showImageDescriptions, setShowImageDescriptions] = useState(false);
  const [useLegacyChatInput, setUseLegacyChatInput] = useState(false);

  const previewTtsSpeech = () => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const text = 'This is a preview of the text to speech rate in Anticeil.';
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = ttsRate;
        window.speechSynthesis.speak(utterance);
        toast.success(t('Memutar preview Text-to-Speech'));
      } else {
        playPreviewSound('message');
      }
    } catch {
      toast.info(t('Preview Text-to-Speech'));
    }
  };

  // ==========================================

  return (
    <div className="space-y-8 divide-y divide-border/50 pb-8">
      {/* Top Sticky Interactive Live Chat Message Preview Box */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md pt-1 pb-4 -mx-3.5 sm:-mx-4 md:-mx-5 lg:-mx-6 px-3.5 sm:px-4 md:px-5 lg:px-6 border-b border-border/50 shadow-xs">
        <AccessibilityPreview
          enableHighContrast={enableHighContrast}
          saturationLevel={saturationLevel}
          chatFontSize={chatFontSize}
          chatMessageDisplay={chatMessageDisplay}
          spaceMessageGroups={spaceMessageGroups}
          showUserAvatars={showUserAvatars}
          roleColorsDisplay={roleColorsDisplay}
          alwaysUnderlineLinks={alwaysUnderlineLinks}
          currentUser={currentUser}
          currentUserName={currentUserName}
        />
      </div>

            {/* SUB-SECTION 1: TEXT READABILITY */}
            <div id="accessibility-text-readability" className="scroll-mt-6 space-y-6 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Text Readability')}</h2>
              </div>

              {/* Text size in chat slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">{t('Text size in chat')}</span>
                  <span className="text-[11px] text-emerald-400 font-mono font-bold">{chatFontSize}px</span>
                </div>
                <div className="text-[11px] text-muted-foreground">{t('Adjust the size of the chat font.')}</div>
                <div className="pt-2">
                  <input
                    type="range"
                    min="12"
                    max="24"
                    step="1"
                    value={chatFontSize}
                    onChange={(e) => setChatFontSize(Number(e.target.value))}
                    className="w-full h-2 bg-muted/60 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
                    <span>12px</span>
                    <span>14px</span>
                    <span>15px</span>
                    <span className="text-emerald-400 font-bold">16px</span>
                    <span>18px</span>
                    <span>20px</span>
                    <span>24px</span>
                  </div>
                </div>
              </div>

              {/* Always underline links */}
              <div className="flex items-center justify-between gap-4 py-2 border-b border-border/50">
                <div>
                  <div className="text-xs font-bold text-foreground">{t('Always underline links')}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {t('Make links stand out more.')}
                  </div>
                </div>
                <Switch checked={alwaysUnderlineLinks} onCheckedChange={setAlwaysUnderlineLinks} />
              </div>

              {/* Display Name Styles */}
              <div className="flex items-center justify-between gap-4 py-2 border-b border-border/50">
                <div>
                  <div className="text-xs font-bold text-foreground">{t('Display Name Styles')}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {t('Enable display name styles — including font, effect, and color — across Anticeil.')}
                  </div>
                </div>
                <Switch checked={displayNameStyles} onCheckedChange={setDisplayNameStyles} />
              </div>
            </div>

            {/* SUB-SECTION 2: VISUAL DENSITY */}
            <div id="accessibility-visual-density" className="scroll-mt-6 space-y-6 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Visual Density')}</h2>
              </div>

              {/* UI Density */}
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-bold text-foreground">{t('UI Density')}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {t('Adjust the space between server, channel, and member lists.')}
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { id: 'compact', title: 'Compact' },
                    { id: 'default', title: 'Default' },
                    { id: 'spacious', title: 'Spacious' },
                  ].map((d) => {
                    const isSelected = uiDensity === d.id;
                    return (
                      <div
                        key={d.id}
                        onClick={() => setUiDensity(d.id as any)}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer',
                          isSelected
                            ? 'bg-primary/5 border-primary'
                            : 'bg-card border-border/70 hover:bg-muted/30',
                        )}
                      >
                        <div
                          className={cn(
                            'size-4 rounded-full border-2 flex items-center justify-center transition-all',
                            isSelected ? 'border-primary' : 'border-muted-foreground/50',
                          )}
                        >
                          {isSelected && <div className="size-2 rounded-full bg-primary" />}
                        </div>
                        <span className="text-xs font-semibold text-foreground">{d.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chat Message Display */}
              <div className="space-y-3 pt-2">
                <div>
                  <div className="text-xs font-bold text-foreground">{t('Chat Message Display')}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {t('Change the appearance of chat messages.')}
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { id: 'default', title: 'Default', desc: 'Beautiful, spacious, and shows user avatars' },
                    { id: 'compact', title: 'Compact', desc: 'Fits more messages on screen at once, hides avatars' },
                  ].map((m) => {
                    const isSelected = chatMessageDisplay === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setChatMessageDisplay(m.id as any)}
                        className={cn(
                          'flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer',
                          isSelected
                            ? 'bg-primary/5 border-primary'
                            : 'bg-card border-border/70 hover:bg-muted/30',
                        )}
                      >
                        <div className="mt-0.5 shrink-0">
                          <div
                            className={cn(
                              'size-4 rounded-full border-2 flex items-center justify-center transition-all',
                              isSelected ? 'border-primary' : 'border-muted-foreground/50',
                            )}
                          >
                            {isSelected && <div className="size-2 rounded-full bg-primary" />}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground">{m.title}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">{m.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Space Between Message Groups */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">{t('Space Between Message Groups')}</span>
                  <span className="text-[11px] text-emerald-400 font-mono font-bold">{spaceMessageGroups}px</span>
                </div>
                <div className="text-[11px] text-muted-foreground">{t('Adjust the spacing between message groups.')}</div>
                <div className="pt-2">
                  <input
                    type="range"
                    min="0"
                    max="24"
                    step="4"
                    value={spaceMessageGroups}
                    onChange={(e) => setSpaceMessageGroups(Number(e.target.value))}
                    className="w-full h-2 bg-muted/60 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
                    <span>0px</span>
                    <span>4px</span>
                    <span>8px</span>
                    <span className="text-emerald-400 font-bold">16px</span>
                    <span>24px</span>
                  </div>
                </div>
              </div>

              {/* Zoom Level */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">{t('Zoom level')}</span>
                  <span className="text-[11px] text-emerald-400 font-mono font-bold">{zoomLevel}%</span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {t('Adjust the size of the interface. You can also change this with ctrl +/-.')}
                </div>
                <div className="pt-2">
                  <input
                    type="range"
                    min="50"
                    max="200"
                    step="5"
                    value={zoomLevel}
                    onChange={(e) => setZoomLevel(Number(e.target.value))}
                    className="w-full h-2 bg-muted/60 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
                    <span>50</span>
                    <span>67</span>
                    <span>75</span>
                    <span>80</span>
                    <span>90</span>
                    <span className="text-emerald-400 font-bold">100</span>
                    <span>110</span>
                    <span>125</span>
                    <span>150</span>
                    <span>175</span>
                    <span>200</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SUB-SECTION 3: COLOR & CONTRAST */}
            <div id="accessibility-color-contrast" className="scroll-mt-6 space-y-6 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Color & Contrast')}</h2>
              </div>

              {/* Saturation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">{t('Saturation')}</span>
                  <span className="text-[11px] text-emerald-400 font-mono font-bold">{saturationLevel}%</span>
                </div>
                <div className="text-[11px] text-muted-foreground leading-relaxed">
                  {t(
                    'Reduce the saturation of colors within the app, for those with color sensitivities. This does not affect the saturation of images, videos, role colors or other user content.',
                  )}
                </div>
                <div className="pt-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="10"
                    value={saturationLevel}
                    onChange={(e) => setSaturationLevel(Number(e.target.value))}
                    className="w-full h-2 bg-muted/60 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
                    <span>0%</span>
                    <span>20%</span>
                    <span>40%</span>
                    <span>60%</span>
                    <span>80%</span>
                    <span className="text-emerald-400 font-bold">100%</span>
                  </div>
                </div>
              </div>

              {/* Switches */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div>
                    <div className="text-xs font-bold text-foreground">{t('Apply saturation setting to custom colors')}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t('Apply the above setting to custom color choices, like role colors.')}
                    </div>
                  </div>
                  <Switch checked={applySaturationCustomColors} onCheckedChange={setApplySaturationCustomColors} />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div>
                    <div className="text-xs font-bold text-foreground">{t('Enable High Contrast Mode')}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t('Enhance visibility with bold colors and sharp contrast.')}
                    </div>
                  </div>
                  <Switch checked={enableHighContrast} onCheckedChange={setEnableHighContrast} />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div>
                    <div className="text-xs font-bold text-foreground">{t('Sync contrast settings')}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t("This allows Anticeil to use your computer's contrast theme. Learn more about contrast settings.")}
                    </div>
                  </div>
                  <Switch checked={syncContrastSettings} onCheckedChange={setSyncContrastSettings} />
                </div>
              </div>

              {/* Role Colors Dropdown */}
              <div className="flex items-center justify-between gap-4 py-2 border-b border-border/50">
                <div>
                  <div className="text-xs font-bold text-foreground">{t('Role Colors')}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {t('Choose how you would like role colors to be displayed.')}
                  </div>
                </div>
                <div className="relative">
                  <select
                    value={roleColorsDisplay}
                    onChange={(e) => setRoleColorsDisplay(e.target.value as any)}
                    className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#1e1f22] border border-border/80 text-foreground appearance-none outline-none focus:ring-1 focus:ring-primary cursor-pointer pr-8"
                  >
                    <option value="names" className="bg-[#2b2d31]">In names</option>
                    <option value="dot" className="bg-[#2b2d31]">As dot next to names</option>
                    <option value="none" className="bg-[#2b2d31]">None</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Official Messages Dropdown */}
              <div className="flex items-center justify-between gap-4 py-2 border-b border-border/50">
                <div>
                  <div className="text-xs font-bold text-foreground">{t('Official Messages')}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {t('Choose how official developer messages look on verified servers that support it.')}
                  </div>
                </div>
                <div className="relative">
                  <select
                    value={officialMessagesStyle}
                    onChange={(e) => setOfficialMessagesStyle(e.target.value as any)}
                    className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#1e1f22] border border-border/80 text-foreground appearance-none outline-none focus:ring-1 focus:ring-primary cursor-pointer pr-8"
                  >
                    <option value="default" className="bg-[#2b2d31]">Default</option>
                    <option value="contrast" className="bg-[#2b2d31]">High Contrast</option>
                    <option value="plain" className="bg-[#2b2d31]">Plain</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Show on/off indicators */}
              <div className="flex items-center justify-between gap-4 py-2 border-b border-border/50">
                <div>
                  <div className="text-xs font-bold text-foreground">{t('Show on/off indicators')}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {t('On forms, menus and settings, on/off toggles will have icons.')}
                  </div>
                </div>
                <Switch checked={showOnOffIndicators} onCheckedChange={setShowOnOffIndicators} />
              </div>

              {/* Related Settings card */}
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Related Settings')}
                </div>
                <div
                  onClick={() => {
                    onNavigateSection?.('appearance');
                    setTimeout(() => {
                      document.getElementById('appearance-theme')?.scrollIntoView({ behavior: 'smooth' });
                    }, 80);
                  }}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border/70 bg-card hover:bg-muted/40 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Palette className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                        {t('Appearance')}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {t('Change your app theme')}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </div>
            </div>

            {/* SUB-SECTION 4: REDUCED MOTION */}
            <AccessibilityReducedMotion
              enableReducedMotion={enableReducedMotion}
              setEnableReducedMotion={setEnableReducedMotion}
              syncReducedMotionComputer={syncReducedMotionComputer}
              setSyncReducedMotionComputer={setSyncReducedMotionComputer}
              notificationDuration={notificationDuration}
              setNotificationDuration={setNotificationDuration}
              playGifsFocused={playGifsFocused}
              setPlayGifsFocused={setPlayGifsFocused}
              playAnimatedEmoji={playAnimatedEmoji}
              setPlayAnimatedEmoji={setPlayAnimatedEmoji}
              stickerAnimationMode={stickerAnimationMode}
              setStickerAnimationMode={setStickerAnimationMode}
            />

            {/* SUB-SECTION 5: AUDIO & SCREEN READER */}
            <div id="accessibility-audio-screen-reader" className="scroll-mt-6 space-y-6 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Audio & Screen Reader')}</h2>
              </div>

              {/* Text-to-Speech rate slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">{t('Text-to-Speech rate')}</span>
                  <span className="text-[11px] text-emerald-400 font-mono font-bold">x{ttsRate.toFixed(1)}</span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {t('Control the speed at which text is read aloud when using Speak Message or other text to speech features.')}
                </div>
                <div className="pt-2">
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={ttsRate}
                    onChange={(e) => setTtsRate(Number(e.target.value))}
                    className="w-full h-2 bg-muted/60 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
                    <span>Slower</span>
                    <span className="text-emerald-400 font-bold">x1.0</span>
                    <span>Faster</span>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={previewTtsSpeech}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-4 h-8 rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>{t('Preview')}</span>
                </Button>
              </div>

              {/* Image descriptions & legacy chat input */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div>
                    <div className="text-xs font-semibold text-foreground">{t('Show image descriptions')}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t('Image descriptions are used to describe images for screen readers.')}
                    </div>
                  </div>
                  <Switch checked={showImageDescriptions} onCheckedChange={setShowImageDescriptions} />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div>
                    <div className="text-xs font-semibold text-foreground">{t('Use the legacy chat input')}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t('Disables most chat features but may work better with screen readers.')}
                    </div>
                  </div>
                  <Switch checked={useLegacyChatInput} onCheckedChange={setUseLegacyChatInput} />
                </div>
              </div>
            </div>
          </div>
  );
}
