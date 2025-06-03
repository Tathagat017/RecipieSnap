import React, { useState } from "react";
import {
  Container,
  Title,
  Text,
  Paper,
  Group,
  Button,
  FileInput,
  Textarea,
  Loader,
  Alert,
  Divider,
  Stack,
  Card,
  Badge,
  Image,
  Box,
  ScrollArea,
} from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUpload,
  faImage,
  faUtensils,
  faExclamationCircle,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { notifications } from "@mantine/notifications";
import axios from "axios";
import { API_CONFIG, ENDPOINTS } from "../../config/api";

interface RecipeResponse {
  success: boolean;
  identifiedIngredients?: string;
  recipes: string;
  message: string;
  error?: string;
}

const RecipeSnap: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [textIngredients, setTextIngredients] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecipeResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"image" | "text">("image");

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);

    if (file) {
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const clearImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
  };

  const handleImageUpload = async () => {
    if (!selectedFile) {
      notifications.show({
        title: "Error",
        message: "Please select an image first",
        color: "red",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const response = await axios.post<RecipeResponse>(
        `${API_CONFIG.BASE_URL}${ENDPOINTS.RECIPES.ANALYZE}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setResult(response.data);
      notifications.show({
        title: "Success",
        message: "Image analyzed successfully!",
        color: "green",
      });
    } catch (error: unknown) {
      console.error("Error analyzing image:", error);
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || "Failed to analyze image"
        : "Failed to analyze image";
      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!textIngredients.trim()) {
      notifications.show({
        title: "Error",
        message: "Please enter some ingredients",
        color: "red",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await axios.post<RecipeResponse>(
        `${API_CONFIG.BASE_URL}${ENDPOINTS.RECIPES.SUGGEST}`,
        {
          ingredients: textIngredients,
        }
      );

      setResult(response.data);
      notifications.show({
        title: "Success",
        message: "Recipe suggestions generated!",
        color: "green",
      });
    } catch (error: unknown) {
      console.error("Error generating recipes:", error);
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || "Failed to generate recipes"
        : "Failed to generate recipes";
      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatRecipes = (recipesText: string) => {
    // Simple formatting to make recipes more readable
    const sections = recipesText.split(/(?=\d+\.|\*\*|Recipe \d+|##)/);
    return sections.map((section, index) => (
      <div key={index} style={{ marginBottom: "1rem" }}>
        {section.trim()}
      </div>
    ));
  };

  return (
    <Container size="lg" py="xl">
      <Stack spacing="xl">
        {/* Header */}
        <div style={{ textAlign: "center" }}>
          <Title order={1} size="h1" mb="sm">
            🍳 RecipeSnap
          </Title>
          <Text size="lg" color="dimmed">
            AI Cooking Assistant from Your Fridge
          </Text>
          <Text size="sm" color="dimmed" mt="xs">
            Upload a photo of your ingredients or type them in to get delicious
            recipe suggestions!
          </Text>
        </div>

        {/* Tab Selection */}
        <Group position="center" spacing="xs">
          <Button
            variant={activeTab === "image" ? "filled" : "outline"}
            leftIcon={<FontAwesomeIcon icon={faImage} />}
            onClick={() => setActiveTab("image")}
          >
            Upload Image
          </Button>
          <Button
            variant={activeTab === "text" ? "filled" : "outline"}
            leftIcon={<FontAwesomeIcon icon={faUtensils} />}
            onClick={() => setActiveTab("text")}
          >
            Type Ingredients
          </Button>
        </Group>

        {/* Input Section */}
        <Paper shadow="sm" p="xl" radius="md">
          {activeTab === "image" ? (
            <Stack spacing="md">
              <Title order={3}>Upload Ingredient Photo</Title>
              <FileInput
                label="Select an image of your ingredients"
                accept="image/*"
                icon={<FontAwesomeIcon icon={faUpload} />}
                value={selectedFile}
                onChange={handleFileChange}
                size="lg"
              />

              {/* Image Preview */}
              {imagePreview && (
                <Card shadow="xs" p="md" radius="md" withBorder>
                  <Group position="apart" align="flex-start" mb="sm">
                    <Text weight={500}>Image Preview:</Text>
                    <Button
                      variant="subtle"
                      color="red"
                      size="xs"
                      onClick={clearImage}
                      leftIcon={<FontAwesomeIcon icon={faTimes} />}
                    >
                      Remove
                    </Button>
                  </Group>
                  <Box style={{ textAlign: "center" }}>
                    <Image
                      src={imagePreview}
                      alt="Selected ingredients"
                      radius="md"
                      fit="contain"
                      height={300}
                      withPlaceholder
                    />
                  </Box>
                  {selectedFile && (
                    <Text size="sm" color="dimmed" mt="sm" align="center">
                      {selectedFile.name} (
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </Text>
                  )}
                </Card>
              )}

              <Button
                size="lg"
                onClick={handleImageUpload}
                loading={loading}
                disabled={!selectedFile}
                fullWidth
              >
                Analyze Image & Get Recipes
              </Button>
            </Stack>
          ) : (
            <Stack spacing="md">
              <Title order={3}>Enter Your Ingredients</Title>
              <Textarea
                placeholder="e.g., tomatoes, onions, garlic, pasta, chicken breast..."
                value={textIngredients}
                onChange={(e) => setTextIngredients(e.target.value)}
                minRows={4}
                size="lg"
              />
              <Button
                size="lg"
                onClick={handleTextSubmit}
                loading={loading}
                disabled={!textIngredients.trim()}
                fullWidth
              >
                Get Recipe Suggestions
              </Button>
            </Stack>
          )}
        </Paper>

        {/* Loading State */}
        {loading && (
          <Paper shadow="sm" p="xl" radius="md">
            <Group position="center" spacing="md">
              <Loader size="md" />
              <Text>
                {activeTab === "image"
                  ? "Analyzing your ingredients..."
                  : "Generating recipe suggestions..."}
              </Text>
            </Group>
          </Paper>
        )}

        {/* Results Section */}
        {result && (
          <Paper shadow="sm" p="xl" radius="md">
            <Stack spacing="lg">
              <Group position="apart" align="center">
                <Title order={2}>Recipe Suggestions</Title>
                <Badge color="green" size="lg">
                  AI Generated
                </Badge>
              </Group>

              {result.identifiedIngredients && (
                <Card shadow="xs" p="md" radius="md" withBorder>
                  <Title order={4} mb="sm">
                    Identified Ingredients:
                  </Title>
                  <Text>{result.identifiedIngredients}</Text>
                </Card>
              )}

              <Divider />

              <ScrollArea style={{ height: "400px" }}>
                <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                  {formatRecipes(result.recipes)}
                </div>
              </ScrollArea>

              {!result.success && (
                <Alert
                  icon={<FontAwesomeIcon icon={faExclamationCircle} />}
                  color="red"
                >
                  {result.error || "Something went wrong"}
                </Alert>
              )}
            </Stack>
          </Paper>
        )}
      </Stack>
    </Container>
  );
};

export default RecipeSnap;
