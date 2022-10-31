class SettingsSubclass:
    """Settings for a subclass"""

    def to_dict(self) -> dict:
        """Convert content to dictionary

        Returns
        -------
        dictionary data
        """
        data = self.__dict__.copy()
        for key in data:
            if isinstance(data[key], SettingsSubclass):
                data.update({key: data[key].to_dict()})
        return data

    def from_dict(self, data):
        """Update content from dictionary

        Parameters
        ----------
        data    dictionary data
        """
        for key in self.__dict__:
            if key in data:
                attribute = getattr(self, key)
                if isinstance(attribute, SettingsSubclass):
                    attribute.from_dict(data[key])
                elif type(attribute) == type(data[key]):
                    setattr(self, key, data[key])
