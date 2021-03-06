import React from 'react';
import {
  View,
  TouchableOpacity,
} from 'react-native';
import { NavigationActions } from 'react-navigation';
import { Camera, ImagePicker, Permissions } from 'expo';

/* from app */
import IconButton from 'app/src/components/IconButton';
import Text from 'app/src/components/Text';
import GA from 'app/src/analytics';
import I18n from 'app/src/i18n';
import styles from './styles';

export default class TakeScreen extends React.Component {
  static navigationOptions = ({ navigation }) => ({
    headerTitle: navigation.getParam('headerTitle', I18n.t('Take.tab2')),
    headerLeft: <IconButton name="md-close" size={28} onPress={() => navigation.dispatch(NavigationActions.back())} />,
  })

  constructor(props) {
    super(props);

    const { navigation } = this.props;

    this.state = {
      // mode: 'photo',
      mode: navigation.getParam('mode', 'photo'),
      hasCameraPermission: null,
      cameraType: Camera.Constants.Type.back,
      flashMode: Camera.Constants.FlashMode.off,
      isRecording: false,
    };

    GA.ScreenHit('Take');
  }

  async componentDidMount() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ hasCameraPermission: status === 'granted' });
  }

  onChangePress = () => {
    const { cameraType } = this.state;

    this.setState({
      cameraType: (cameraType === Camera.Constants.Type.back) ? Camera.Constants.Type.front : Camera.Constants.Type.back,
      flashMode: Camera.Constants.FlashMode.off,
    });
  }

  onFlashPress = () => {
    const { flashMode } = this.state;

    this.setState({
      flashMode: (flashMode === Camera.Constants.FlashMode.off) ? Camera.Constants.FlashMode.on : Camera.Constants.FlashMode.off,
    });
  }

  onTakePress = async () => {
    const { mode, isRecording } = this.state;
    const { navigation } = this.props;

    if (this.camera && !isRecording) {
      this.setState({ isRecording: true });

      const photo = await this.camera.takePictureAsync({
        quality: 1.0,
        base64: false,
        exif: false,
      });

      this.setState({ isRecording: false });

      navigation.push('TakePublish', { mode, photo });
    }
  }

  onRecordPress = async () => {
    const { mode, isRecording } = this.state;
    const { navigation } = this.props;

    if (this.camera && !isRecording) {
      this.setState({ isRecording: true });

      this.setState({ isRecording: false });
      navigation.push('TakePublish', { mode, movie: this.movie });
    } else {
      this.setState({ isRecording: false });
      this.camera.stopRecording();
    }
  }

  onTabPress = async (mode = 'photo', headerTitle = I18n.t('Take.tab2')) => {
    const { flashMode } = this.state;
    const { navigation } = this.props;

    if (mode === 'photo') {
      this.setState({
        mode,
        flashMode: (mode === 'photo') ? flashMode : Camera.Constants.FlashMode.off,
      });

      navigation.setParams({
        headerTitle,
      });
    } else {
      const permissions = Permissions.CAMERA_ROLL;
      const { status } = await Permissions.askAsync(permissions);

      if (status) {
        const photo = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [1, 1],
        });
        if (!photo.cancelled) {
          navigation.dispatch({ type: 'TAKEMODAL_CLOSE' });
          navigation.dispatch({ type: 'PHOTO_SET', payload: photo });
        }
      }
    }
  }

  render() {
    const {
      mode,
      hasCameraPermission,
      cameraType,
      flashMode,
    } = this.state;

    if (hasCameraPermission === null) {
      return <View style={styles.container} />;
    } if (hasCameraPermission === false) {
      return (
        <View style={[styles.container, styles.empty]}>
          <Text style={styles.emptyText}>{I18n.t('Take.noPermission')}</Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <Camera
          style={styles.camera}
          type={cameraType}
          flashMode={flashMode}
          ratio="1:1"
          ref={(ref) => { this.camera = ref; }}
        >
          <IconButton
            name="ios-reverse-camera-outline"
            size={36}
            color="#fff"
            style={styles.change}
            onPress={this.onChangePress}
          />
          {(cameraType === Camera.Constants.Type.back && mode === 'photo') && (
            <IconButton
              name="ios-flash"
              size={36}
              color={flashMode === Camera.Constants.FlashMode.on ? '#ffff00' : '#fff'}
              style={styles.change}
              onPress={this.onFlashPress}
            />
          )}
        </Camera>
        <View style={styles.take}>
          {mode === 'photo' && <TouchableOpacity style={styles.takeButton} onPress={this.onTakePress} />}
        </View>
        <View style={styles.tabs}>
          <TouchableOpacity style={styles.tab} onPress={() => this.onTabPress('library', I18n.t('Take.tab1'))}>
            <Text style={[styles.tabText, (mode === 'library') ? styles.tabTextActive : null]}>{I18n.t('Take.tab1')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab} onPress={() => this.onTabPress('photo', I18n.t('Take.tab2'))}>
            <Text style={[styles.tabText, (mode === 'photo') ? styles.tabTextActive : null]}>{I18n.t('Take.tab2')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}
