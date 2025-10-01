import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import {
  Sparkles, Scissors, Palette, Music, Type,
  Download, Play, Pause, SkipForward, Volume2,
  Smartphone, Monitor, Square, Film, Image,
  CheckCircle, Clock, AlertCircle, Loader2
} from 'lucide-react';

type EditingPreviewProps = {
  session: any;
};

type EditingOptions = {
  autoCut: boolean;
  addBranding: boolean;
  generateMultipleAspectRatios: boolean;
  createTrailer: boolean;
  createGif: boolean;
  addMusic: boolean;
  addCaptions: boolean;
  colorCorrection: boolean;
  stabilization: boolean;
};

type ContentVersion = {
  id: string;
  aspectRatio: string;
  platform: string;
  url: string;
  duration?: number;
  fileSize: number;
};

export default function EditingPreview({ session }: EditingPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<ContentVersion | null>(null);
  const [editingOptions, setEditingOptions] = useState<EditingOptions>({
    autoCut: true,
    addBranding: true,
    generateMultipleAspectRatios: true,
    createTrailer: true,
    createGif: true,
    addMusic: false,
    addCaptions: true,
    colorCorrection: true,
    stabilization: true,
  });
  const [volume, setVolume] = useState([80]);
  const { toast } = useToast();

  // Get editing task status
  const { data: editingTask, isLoading: taskLoading } = useQuery({
    queryKey: [`/api/creator/content/editing/${session.id}`],
    enabled: !!session.id,
    refetchInterval: (data) => {
      // Poll while processing
      if (data?.status === 'processing') {
        return 2000;
      }
      return false;
    },
  });

  // Get content versions
  const { data: versions = [], isLoading: versionsLoading } = useQuery<ContentVersion[]>({
    queryKey: [`/api/creator/content/versions/${session.id}`],
    enabled: editingTask?.status === 'completed',
  });

  // Get AI pricing suggestions
  const { data: pricingSuggestion } = useQuery({
    queryKey: [`/api/creator/content/pricing/${session.id}`],
    enabled: editingTask?.status === 'completed',
  });

  // Process content mutation
  const processContentMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/api/creator/content/process/${session.id}`, {
        method: 'POST',
        body: { editingOptions },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/creator/content/editing/${session.id}`] });
      toast({
        title: 'Processing started',
        description: 'AI is now editing your content. This may take a few minutes.',
      });
    },
  });

  // Download content
  const downloadContent = (version: ContentVersion) => {
    const link = document.createElement('a');
    link.href = version.url;
    link.download = `content-${version.aspectRatio.replace(':', 'x')}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getAspectRatioIcon = (ratio: string) => {
    switch (ratio) {
      case '9:16':
        return <Smartphone className="h-4 w-4" />;
      case '16:9':
        return <Monitor className="h-4 w-4" />;
      case '1:1':
        return <Square className="h-4 w-4" />;
      default:
        return <Film className="h-4 w-4" />;
    }
  };

  const getStatusBadge = () => {
    if (!editingTask) return null;

    switch (editingTask.status) {
      case 'pending':
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processing
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="default" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    // Select first version when available
    if (versions.length > 0 && !selectedVersion) {
      setSelectedVersion(versions[0]);
    }
  }, [versions, selectedVersion]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{session.title}</CardTitle>
              <CardDescription>
                {session.description || 'AI-powered content editing'}
              </CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
      </Card>

      {/* AI Editor Settings */}
      {(!editingTask || editingTask.status === 'pending') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Editing Options
            </CardTitle>
            <CardDescription>
              Customize how AI processes your content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoCut" className="flex items-center gap-2">
                  <Scissors className="h-4 w-4" />
                  Auto Cut & Trim
                </Label>
                <Switch
                  id="autoCut"
                  checked={editingOptions.autoCut}
                  onCheckedChange={(checked) =>
                    setEditingOptions({ ...editingOptions, autoCut: checked })
                  }
                  data-testid="switch-auto-cut"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="addBranding" className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Add Branding
                </Label>
                <Switch
                  id="addBranding"
                  checked={editingOptions.addBranding}
                  onCheckedChange={(checked) =>
                    setEditingOptions({ ...editingOptions, addBranding: checked })
                  }
                  data-testid="switch-branding"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="multiAspect" className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  Multiple Aspect Ratios
                </Label>
                <Switch
                  id="multiAspect"
                  checked={editingOptions.generateMultipleAspectRatios}
                  onCheckedChange={(checked) =>
                    setEditingOptions({ ...editingOptions, generateMultipleAspectRatios: checked })
                  }
                  data-testid="switch-multi-aspect"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="createTrailer" className="flex items-center gap-2">
                  <Film className="h-4 w-4" />
                  Create Trailer
                </Label>
                <Switch
                  id="createTrailer"
                  checked={editingOptions.createTrailer}
                  onCheckedChange={(checked) =>
                    setEditingOptions({ ...editingOptions, createTrailer: checked })
                  }
                  data-testid="switch-trailer"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="createGif" className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Create GIF
                </Label>
                <Switch
                  id="createGif"
                  checked={editingOptions.createGif}
                  onCheckedChange={(checked) =>
                    setEditingOptions({ ...editingOptions, createGif: checked })
                  }
                  data-testid="switch-gif"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="addMusic" className="flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  Add Music
                </Label>
                <Switch
                  id="addMusic"
                  checked={editingOptions.addMusic}
                  onCheckedChange={(checked) =>
                    setEditingOptions({ ...editingOptions, addMusic: checked })
                  }
                  data-testid="switch-music"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="addCaptions" className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Auto Captions
                </Label>
                <Switch
                  id="addCaptions"
                  checked={editingOptions.addCaptions}
                  onCheckedChange={(checked) =>
                    setEditingOptions({ ...editingOptions, addCaptions: checked })
                  }
                  data-testid="switch-captions"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="colorCorrection" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Color Correction
                </Label>
                <Switch
                  id="colorCorrection"
                  checked={editingOptions.colorCorrection}
                  onCheckedChange={(checked) =>
                    setEditingOptions({ ...editingOptions, colorCorrection: checked })
                  }
                  data-testid="switch-color"
                />
              </div>
            </div>

            <Button
              onClick={() => processContentMutation.mutate()}
              disabled={processContentMutation.isPending}
              className="w-full"
              size="lg"
              data-testid="button-start-processing"
            >
              {processContentMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Start AI Processing
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Processing Status */}
      {editingTask?.status === 'processing' && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
              <h3 className="text-lg font-medium">AI is processing your content</h3>
              <p className="text-muted-foreground">
                This usually takes 2-5 minutes depending on content length
              </p>
              {editingTask.progress && (
                <div className="max-w-xs mx-auto">
                  <Progress value={editingTask.progress} />
                  <p className="text-sm text-muted-foreground mt-2">
                    {editingTask.progress}% complete
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview and Versions */}
      {editingTask?.status === 'completed' && versions.length > 0 && (
        <>
          {/* Preview Player */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                Review your AI-edited content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedVersion && (
                <>
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      src={selectedVersion.url}
                      controls
                      className="w-full h-full"
                      data-testid="video-player"
                    />
                  </div>

                  {/* Player Controls */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 flex-1">
                      <Volume2 className="h-4 w-4" />
                      <Slider
                        value={volume}
                        onValueChange={setVolume}
                        max={100}
                        step={1}
                        className="flex-1"
                        data-testid="slider-volume"
                      />
                    </div>
                    <Button
                      onClick={() => downloadContent(selectedVersion)}
                      data-testid="button-download"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Content Versions */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Versions</CardTitle>
              <CardDescription>
                AI has created multiple versions optimized for different platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={versions[0]?.aspectRatio}>
                <TabsList className="grid w-full grid-cols-3">
                  {versions.map((version) => (
                    <TabsTrigger
                      key={version.id}
                      value={version.aspectRatio}
                      onClick={() => setSelectedVersion(version)}
                      data-testid={`tab-version-${version.aspectRatio}`}
                    >
                      {getAspectRatioIcon(version.aspectRatio)}
                      <span className="ml-2">{version.aspectRatio}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
                {versions.map((version) => (
                  <TabsContent key={version.id} value={version.aspectRatio} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Platform</p>
                        <p className="font-medium">{version.platform}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">File Size</p>
                        <p className="font-medium">
                          {(version.fileSize / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      {version.duration && (
                        <div>
                          <p className="text-muted-foreground">Duration</p>
                          <p className="font-medium">{version.duration}s</p>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => downloadContent(version)}
                      data-testid={`button-download-${version.aspectRatio}`}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download {version.aspectRatio} Version
                    </Button>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* AI Pricing Suggestions */}
          {pricingSuggestion && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  AI Pricing Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Minimum</p>
                    <p className="text-2xl font-bold" data-testid="price-min">
                      ${pricingSuggestion.min}
                    </p>
                  </div>
                  <div className="border-2 border-primary rounded-lg p-2">
                    <p className="text-sm font-medium text-primary">Recommended</p>
                    <p className="text-3xl font-bold text-primary" data-testid="price-recommended">
                      ${pricingSuggestion.recommended}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Maximum</p>
                    <p className="text-2xl font-bold" data-testid="price-max">
                      ${pricingSuggestion.max}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Based on content quality, duration, and market analysis
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}