import { Dimensions } from "react-native";

export const on5SOrSmaller = () => {
    return Dimensions.get('window').width < 350;
};
