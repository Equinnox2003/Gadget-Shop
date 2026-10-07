import { useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Press } from '@/components/Press';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CATEGORIES, COLORS, HEADPHONE_TAGS } from '@/constants/theme';
import type { CategoryName, HeadphoneTag, Product } from '@/data/seed';
import { useStore } from '@/store/StoreContext';
import { PrimaryButton } from '@/components/ui';
import { ProductImage } from '@/components/ProductImage';
import { useBusy } from '@/hooks/useBusy';
import { toast } from '@/components/Toast';

type ImageSource = 'upload' | 'url';

function initialImageSource(image: string | undefined): ImageSource {
  return image && image.startsWith('data:') ? 'upload' : 'url';
}

function isValidImageUrl(value: string): boolean {
  const v = value.trim();
  if (!v) return true;
  return /^(https?:\/\/|data:image\/)/i.test(v);
}

const SPEC_PRESETS: Record<string, string[]> = {
  'Phones & Accessories': ['Display', 'Processor', 'RAM', 'Storage', 'Battery', 'Camera', 'Operating System'],
  'Computers & Laptops': ['Processor', 'RAM', 'Storage', 'GPU', 'Display', 'Battery'],
  'TV & Video': ['Screen Size', 'Resolution', 'Panel Type', 'Refresh Rate', 'Smart TV Platform'],
  Headphones: ['Connectivity', 'Battery Life', 'Noise Cancellation', 'Driver Size', 'Microphone'],
  Speakers: ['Connectivity', 'Battery Life', 'Waterproof', 'Power'],
  'Camera & Photo': ['Sensor', 'Video', 'Mount', 'Display', 'Connectivity'],
  'Video Games': ['Storage', 'Resolution', 'Controller', 'In the Box'],
};

export default function ProductFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const webNarrow = Platform.OS === 'web' && width >= 700;
  const { getProduct, upsertProduct } = useStore();
  const editing = id ? getProduct(String(id)) : undefined;

  const [name, setName] = useState(editing?.name ?? '');
  const [brand, setBrand] = useState(editing?.brand ?? '');
  const [category, setCategory] = useState<CategoryName>(editing?.category ?? 'Headphones');
  const [tag, setTag] = useState<HeadphoneTag | 'None'>(
    (editing?.tag as HeadphoneTag | undefined) ?? 'None'
  );
  const [price, setPrice] = useState(editing ? String(editing.price) : '');
  const [imageSource, setImageSource] = useState<ImageSource>(
    initialImageSource(editing?.image)
  );
  const [uploadedImage, setUploadedImage] = useState(
    editing?.image && editing.image.startsWith('data:') ? editing.image : ''
  );
  const [imageUrl, setImageUrl] = useState(
    editing?.image && !editing.image.startsWith('data:') ? editing.image : ''
  );
  const [description, setDescription] = useState(editing?.description ?? '');
  const [rating, setRating] = useState(editing ? String(editing.rating) : '4.5');
  const [stock, setStock] = useState(editing ? String(editing.stock) : '10');
  const [available, setAvailable] = useState(editing?.available ?? true);
  const [colors, setColors] = useState((editing?.colors ?? []).join(', '));
  const [specs, setSpecs] = useState<Record<string, string>>(editing?.specs ?? {});

  const presetKeys = useMemo(
    () => SPEC_PRESETS[category] ?? ['Feature', 'Warranty'],
    [category]
  );

  const activeImage = imageSource === 'upload' ? uploadedImage : imageUrl.trim();

  const pickImage = async () => {
    runUpload(async () => {
      try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Permission required',
          'Please allow photo library access to upload a product image.'
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.5,
        base64: true,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      let uri = asset.uri;
      if (asset.base64) {
        const mime = asset.mimeType ?? 'image/jpeg';
        uri = `data:${mime};base64,${asset.base64}`;
      }
      if (uri.length > 2500000) {
        Alert.alert(
          'Image too large',
          'This image is too large to store locally. Please pick a smaller photo or use an image URL instead.'
        );
        return;
      }
      setUploadedImage(uri);
      setImageSource('upload');
      } catch {
        Alert.alert('Upload failed', 'Could not load that image. Please try another photo or paste an image URL.');
      }
    });
  };

  const removeActiveImage = () => {
    if (imageSource === 'upload') setUploadedImage('');
    else setImageUrl('');
  };

  const save = () => {
    if (!name.trim()) return Alert.alert('Validation', 'Product name is required.');
    if (!brand.trim()) return Alert.alert('Validation', 'Brand is required.');
    if (!category) return Alert.alert('Validation', 'Category is required.');
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0)
      return Alert.alert('Validation', 'Price must be a non-negative number.');
    const stockNum = Number(stock);
    if (!Number.isInteger(stockNum) || stockNum < 0)
      return Alert.alert('Validation', 'Stock must be a non-negative whole number.');
    const ratingNum = Math.min(5, Math.max(0, Number(rating) || 0));
    if (imageSource === 'url' && !isValidImageUrl(imageUrl)) {
      return Alert.alert(
        'Validation',
        'The image URL looks invalid. It should start with http:// or https://.'
      );
    }

    const product: Product = {
      id: editing?.id ?? `p${Date.now()}`,
      name: name.trim(),
      brand: brand.trim(),
      category,
      tag: category === 'Headphones' && tag !== 'None' ? (tag as HeadphoneTag) : undefined,
      price: Math.round(priceNum * 100) / 100,
      image: activeImage,
      description: description.trim() || 'Quality gadget from Gadget Shop.',
      rating: ratingNum,
      stock: stockNum,
      available: stockNum === 0 ? false : available,
      colors: colors
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
      variants: editing?.variants,
      specs,
      createdAt: editing?.createdAt ?? Date.now(),
      popularity: editing?.popularity ?? 10,
    };
    upsertProduct(product);
    toast(`Saved "${product.name}"`);
    router.back();
  };
  const { busy: saving, run: runSave } = useBusy();
  const { busy: uploading, run: runUpload } = useBusy();

  const onSave = () => {
    runSave(async () => {
      save();
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <Press onPress={() => router.back()} accessibilityLabel="Go back" style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.ink} />
        </Press>
        <Text style={styles.title}>{editing ? 'Edit Product' : 'Add Product'}</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={[styles.container, webNarrow && styles.web]}>
        <Label text="Product Name *" />
        <Input value={name} onChangeText={setName} placeholder="e.g. Sony WH-1000XM5" />
        <Label text="Brand *" />
        <Input value={brand} onChangeText={setBrand} placeholder="e.g. Sony" />

        <Label text="Category *" />
        <View style={styles.wrap}>
          {(CATEGORIES as readonly CategoryName[]).map((c) => (
            <Press
              key={c}
              onPress={() => setCategory(c)}
              style={[styles.chip, category === c ? styles.chipActive : styles.chipIdle]}>
              <Text style={styles.chipText}>{c}</Text>
            </Press>
          ))}
        </View>

        {category === 'Headphones' && (
          <>
            <Label text="Type" />
            <View style={styles.wrap}>
              {(['None', ...HEADPHONE_TAGS] as const).map((t) => (
                <Press
                  key={t}
                  onPress={() => setTag(t)}
                  style={[styles.chip, tag === t ? styles.chipActive : styles.chipIdle]}>
                  <Text style={styles.chipText}>{t}</Text>
                </Press>
              ))}
            </View>
          </>
        )}

        <View style={styles.duo}>
          <View style={{ flex: 1 }}>
            <Label text="Price (₱) *" />
            <Input value={price} onChangeText={(t) => setPrice(t.replace(/[^0-9.]/g, ''))} placeholder="0" keyboardType="decimal-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <Label text="Rating (0-5)" />
            <Input value={rating} onChangeText={(t) => setRating(t.replace(/[^0-9.]/g, ''))} placeholder="4.5" keyboardType="decimal-pad" />
          </View>
        </View>

        <View style={styles.duo}>
          <View style={{ flex: 1 }}>
            <Label text="Stock *" />
            <Input value={stock} onChangeText={(t) => setStock(t.replace(/[^0-9]/g, ''))} placeholder="0" keyboardType="number-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <Label text="Colors (comma separated)" />
            <Input value={colors} onChangeText={setColors} placeholder="Black, White, Blue" />
          </View>
        </View>

        <View style={styles.availRow}>
          <Text style={styles.availText}>Available</Text>
          <Switch value={available} onValueChange={setAvailable} trackColor={{ true: COLORS.pink }} />
        </View>

        <Label text="Product Image" />
        <View style={styles.sourceRow}>
          <Press
            onPress={() => setImageSource('upload')}
            style={[styles.sourceBtn, imageSource === 'upload' && styles.sourceBtnActive]}>
            <Ionicons name="cloud-upload-outline" size={16} color={COLORS.ink} />
            <Text style={[styles.sourceText, imageSource === 'upload' && styles.sourceTextActive]}>
              Upload Image
            </Text>
          </Press>
          <Press
            onPress={() => setImageSource('url')}
            style={[styles.sourceBtn, imageSource === 'url' && styles.sourceBtnActive]}>
            <Ionicons name="link-outline" size={16} color={COLORS.ink} />
            <Text style={[styles.sourceText, imageSource === 'url' && styles.sourceTextActive]}>
              Paste Image URL
            </Text>
          </Press>
        </View>

        {imageSource === 'upload' ? (
          <View style={styles.uploadBox}>
            <Press onPress={pickImage} disabled={uploading} style={styles.chooseBtn}>
              <Ionicons name="image-outline" size={18} color={COLORS.ink} />
              <Text style={styles.chooseText}>
                {uploading ? 'Uploading...' : uploadedImage ? 'Change Image' : 'Choose from device'}
              </Text>
            </Press>
            <Text style={styles.uploadHint}>PNG, JPG, JPEG or WEBP from your photo library or computer files.</Text>
          </View>
        ) : (
          <Input
            value={imageUrl}
            onChangeText={(t) => {
              setImageUrl(t);
              if (t.trim()) setImageSource('url');
            }}
            placeholder="https://example.com/product.jpg"
            autoCapitalize="none"
            keyboardType="url"
          />
        )}

        <Text style={styles.previewLabel}>
          Preview:{' '}
          {activeImage
            ? imageSource === 'upload'
              ? 'using uploaded image'
              : 'using image URL'
            : 'no image — placeholder will be used'}
        </Text>
        <View style={styles.previewRow}>
          <View style={styles.previewBox}>
            <ProductImage uri={activeImage} rounded={14} iconSize={36} />
          </View>
          {!!activeImage && (
            <Press onPress={removeActiveImage} style={styles.removeBtn}>
              <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
              <Text style={styles.removeText}>Remove</Text>
            </Press>
          )}
        </View>

        <Label text="Description" />
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Product description"
          multiline
          style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
        />

        <Label text={`Specifications (${category})`} />
        {presetKeys.map((k) => (
          <View key={k}>
            <Text style={styles.specK}>{k}</Text>
            <Input value={specs[k] ?? ''} onChangeText={(t) => setSpecs((s) => ({ ...s, [k]: t }))} placeholder={k} />
          </View>
        ))}

        <PrimaryButton
          label={saving ? 'Saving...' : editing ? 'Update Product' : 'Add Product'}
          loading={saving}
          onPress={onSave}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}

function Input(props: React.ComponentProps<typeof TextInput>) {
  return <TextInput {...props} style={[styles.input, props.style]} placeholderTextColor={COLORS.faint} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.accent },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 48,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.ink },
  container: { paddingHorizontal: 16, paddingBottom: 32, gap: 2 },
  web: { maxWidth: 640, alignSelf: 'center', width: '100%' },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.ink, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 46,
    fontSize: 14,
    color: COLORS.ink,
    marginTop: 6,
    backgroundColor: '#fff',
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { paddingHorizontal: 14, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  chipIdle: { backgroundColor: COLORS.blue },
  chipActive: { backgroundColor: COLORS.pink },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.ink },
  duo: { flexDirection: 'row', gap: 12 },
  availRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  availText: { fontSize: 14, fontWeight: '700', color: COLORS.ink },
  specK: { fontSize: 12, fontWeight: '600', color: COLORS.muted, marginTop: 8 },
  sourceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  sourceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 14,
    backgroundColor: COLORS.blue,
  },
  sourceBtnActive: { backgroundColor: COLORS.pink },
  sourceText: { fontSize: 13, fontWeight: '600', color: COLORS.ink },
  sourceTextActive: { fontWeight: '800' },
  uploadBox: { marginTop: 8, gap: 6 },
  chooseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: 16,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.blue,
  },
  chooseText: { fontSize: 14, fontWeight: '800', color: COLORS.ink },
  uploadHint: { fontSize: 12, color: COLORS.muted },
  previewLabel: { fontSize: 12, fontWeight: '600', color: COLORS.muted, marginTop: 10 },
  previewRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginTop: 6 },
  previewBox: { width: 160, height: 160, borderRadius: 14, overflow: 'hidden' },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
  },
  removeText: { fontSize: 13, fontWeight: '800', color: COLORS.danger },
});

