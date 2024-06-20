import { FlashList } from '@shopify/flash-list';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Button, EmptyList, Image, Input, View } from '@/ui';

type MediaLibraryPickerProps = {
  images: string[];
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
  type?: 'edit' | 'detail';
};

// eslint-disable-next-line max-lines-per-function
export default function MediaLibraryPicker({
  images,
  setImages,
  type = 'edit',
}: MediaLibraryPickerProps) {
  const [albums, setAlbums] = useState<MediaLibrary.Album[]>([]);
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
  const [searchAlbum, setSearchAlbum] = useState('');
  const [isAlbumLoading, setIsAlbumLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setIsAlbumLoading(true);
      if (permissionResponse && permissionResponse.status !== 'granted') {
        await requestPermission();
      }
      const fetchedAlbums = await MediaLibrary.getAlbumsAsync({
        includeSmartAlbums: true,
      });
      setAlbums(fetchedAlbums);
      setIsAlbumLoading(false);
    })();
  }, [permissionResponse, requestPermission]);

  const pickImagesHandler = useCallback(async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImages(result.assets?.map((asset) => asset.uri));
    }
  }, [setImages]);

  const getAlbumAssetsHandler = useCallback(
    async (album: MediaLibrary.Album) => {
      setIsImageLoading(true);
      const albumAssets = await MediaLibrary.getAssetsAsync({ album });
      setImages(albumAssets.assets.map((asset) => asset.uri));
      setIsImageLoading(false);
    },
    [setImages]
  );

  const renderAlbumItem = useCallback(
    ({ item }: { item: MediaLibrary.Album }) => (
      <Button
        label={item.title}
        variant="outline"
        className="mr-3"
        onPress={() => getAlbumAssetsHandler(item)}
      />
    ),
    [getAlbumAssetsHandler]
  );

  const renderImageItem = useCallback(
    ({ item }: { item: string }) => (
      <Image
        className="mr-3 h-56 w-56 overflow-hidden rounded-md"
        contentFit="cover"
        source={{
          uri: item,
        }}
      />
    ),
    []
  );

  const filteredAlbums = useMemo(
    () =>
      albums.length && searchAlbum.length >= 3
        ? albums.filter((album) =>
            album.title.toLowerCase().includes(searchAlbum.toLowerCase())
          )
        : albums,
    [albums, searchAlbum]
  );

  return type === 'edit' ? (
    <View className="flex-1 gap-3">
      <Button
        label="Pick Images"
        variant="secondary"
        onPress={pickImagesHandler}
      />
      <Input
        placeholder="Search Album"
        testID="search-input"
        autoCapitalize="none"
        onChangeText={setSearchAlbum}
        value={searchAlbum}
      />
      <FlashList
        data={filteredAlbums}
        renderItem={renderAlbumItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <EmptyList
            isLoading={isAlbumLoading}
            className="w-[90vw] mx-auto flex items-center justify-center"
          />
        }
        estimatedItemSize={100}
        horizontal
        contentContainerClassName="h-14"
        showsHorizontalScrollIndicator={false}
      />
      <FlashList
        data={images}
        renderItem={renderImageItem}
        keyExtractor={(item) => item}
        ListEmptyComponent={
          <EmptyList
            isLoading={isImageLoading}
            className="w-[90vw] mx-auto flex items-center justify-center"
          />
        }
        estimatedItemSize={200}
        horizontal
        contentContainerClassName="h-56 mb-4"
        showsHorizontalScrollIndicator={false}
      />
    </View>
  ) : (
    <FlashList
      data={images}
      renderItem={renderImageItem}
      keyExtractor={(item) => item}
      ListEmptyComponent={
        <EmptyList
          isLoading={isImageLoading}
          className="w-[90vw] mx-auto flex items-center justify-center"
        />
      }
      estimatedItemSize={200}
      horizontal
      contentContainerClassName="h-56"
      showsHorizontalScrollIndicator={false}
    />
  );
}
