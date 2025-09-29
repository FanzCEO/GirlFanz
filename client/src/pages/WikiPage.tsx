import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, Star, Clock, Eye, ChevronRight } from "lucide-react";

interface WikiArticle {
  id: string;
  title: string;
  slug: string;
  summary: string;
  tags: string[];
  publishedAt: string;
  views?: number;
  rating?: number;
}

export default function WikiPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Mock data for now - would be replaced with API call
  const mockArticles: WikiArticle[] = [
    {
      id: '1',
      title: 'Getting Started with GirlFanz',
      slug: 'getting-started',
      summary: 'Complete guide to setting up your creator profile and uploading your first content',
      tags: ['beginner', 'setup', 'profile'],
      publishedAt: '2024-01-20T10:00:00Z',
      views: 1250,
      rating: 4.8
    },
    {
      id: '2',
      title: 'Understanding Payout Systems',
      slug: 'payout-systems',
      summary: 'Learn about different payout methods, schedules, and how to maximize your earnings',
      tags: ['earnings', 'payouts', 'money'],
      publishedAt: '2024-01-19T14:30:00Z',
      views: 892,
      rating: 4.6
    },
    {
      id: '3',
      title: 'Content Moderation Guidelines',
      slug: 'moderation-guidelines',
      summary: 'Understand our community guidelines and content moderation policies',
      tags: ['guidelines', 'moderation', 'policy'],
      publishedAt: '2024-01-18T09:15:00Z',
      views: 634,
      rating: 4.4
    }
  ];

  const { data: articles = mockArticles, isLoading } = useQuery<WikiArticle[]>({
    queryKey: ['/api/wiki/articles', searchQuery],
    initialData: mockArticles,
  });

  const filteredArticles = articles.filter(article => {
    const matchesSearch = searchQuery === '' || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === null || 
      article.tags.includes(selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  const allTags = [...new Set(mockArticles.flatMap(article => article.tags))];
  const popularTags = ['beginner', 'earnings', 'setup', 'guidelines'];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Ghostly Background */}
      <div 
        className="fixed inset-0 opacity-20 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1000 1000\"><defs><radialGradient id=\"g\" cx=\"50%\" cy=\"50%\" r=\"50%\"><stop offset=\"0%\" stop-color=\"%23ff00ff\" stop-opacity=\"0.3\"/><stop offset=\"100%\" stop-color=\"%2300ffff\" stop-opacity=\"0.1\"/></radialGradient></defs><rect width=\"100%\" height=\"100%\" fill=\"url(%23g)\"/></svg>')"
        }}
      />
      
      <div className="relative container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Knowledge Base
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            AI-powered help articles and guides to master the GirlFanz platform
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search articles, guides, and topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-gray-900/50 border-gray-800 text-white text-lg"
              data-testid="input-wiki-search"
            />
          </div>
        </div>

        {/* Popular Categories */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Popular Topics</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => setSelectedCategory(null)}
              className={selectedCategory === null ? 
                "bg-blue-600 hover:bg-blue-700" : 
                "border-gray-600 text-gray-300 hover:bg-gray-800"
              }
              data-testid="filter-all-topics"
            >
              All Topics
            </Button>
            {popularTags.map((tag) => (
              <Button
                key={tag}
                variant={selectedCategory === tag ? "default" : "outline"}
                onClick={() => setSelectedCategory(selectedCategory === tag ? null : tag)}
                className={selectedCategory === tag ? 
                  "bg-blue-600 hover:bg-blue-700" : 
                  "border-gray-600 text-gray-300 hover:bg-gray-800"
                }
                data-testid={`filter-${tag}`}
              >
                {tag.charAt(0).toUpperCase() + tag.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Articles Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-700 rounded w-full"></div>
                    <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : filteredArticles.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <Card 
                key={article.id} 
                className="bg-gray-900/50 border-gray-800 hover:bg-gray-800/50 transition-colors cursor-pointer group"
                data-testid={`article-${article.slug}`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-2">
                    <BookOpen className="h-6 w-6 text-blue-400" />
                    <div className="flex items-center space-x-2">
                      {article.rating && (
                        <div className="flex items-center text-yellow-400">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="text-sm ml-1">{article.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-white group-hover:text-blue-400 transition-colors">
                    {article.title}
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    {article.summary}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {article.tags.slice(0, 3).map((tag) => (
                      <Badge 
                        key={tag} 
                        variant="outline" 
                        className="text-xs border-blue-600 text-blue-400"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {article.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                        +{article.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(article.publishedAt).toLocaleDateString()}
                      </div>
                      {article.views && (
                        <div className="flex items-center">
                          <Eye className="h-4 w-4 mr-1" />
                          {article.views}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="text-center py-12">
              <Search className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No articles found</h3>
              <p className="text-gray-400 mb-4">
                {searchQuery ? 
                  `No articles match "${searchQuery}". Try different keywords or browse by category.` :
                  'No articles available at the moment.'
                }
              </p>
              <Button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                }}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* AI Assistant */}
        <Card className="mt-8 bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border-blue-800/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <BookOpen className="h-6 w-6 mr-2 text-cyan-400" />
              AI-Powered Knowledge Assistant
            </CardTitle>
            <CardDescription className="text-gray-300">
              Can't find what you're looking for? Our AI assistant can help you find relevant information instantly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              data-testid="button-ai-assistant"
            >
              Ask AI Assistant
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}