package com.aglugan.backend.auth;

import com.aglugan.backend.auth.authDTO.GoogleUserDTO;
import com.aglugan.backend.auth.authDTO.ResultDTO;
import com.aglugan.backend.auth.authDTO.SecondInformationDTO;
import com.aglugan.backend.entity.Driver;
import com.aglugan.backend.entity.User;
import com.aglugan.backend.service.DriverService;
import com.aglugan.backend.service.UserService;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.aglugan.backend.auth.googleAuth.GoogleTokenVerifier;
import com.aglugan.backend.auth.jwt.JwtService;

import java.util.Objects;
import java.util.Optional;

@Service
public class AuthService {

    private final GoogleTokenVerifier verifier;
    private final UserService userService;
    private final JwtService jwtService;
    private final DriverService driverService;

    @Autowired
    public AuthService(GoogleTokenVerifier verifier, UserService userService, JwtService jwtService, DriverService driverService) {
        this.verifier = verifier;
        this.userService = userService;
        this.jwtService = jwtService;
        this.driverService = driverService;
    }

    public String verifyToken(String token) {
        ResultDTO userInfo = verifier.verifyGoogleToken(token);


        if(!userInfo.isGoogleUserSuccess() || userInfo.getGoogleUser() == null) {
            return userInfo.getErrorMessage();
        }

//      sign userInfo with jwt
        return jwtService.generateToken(userInfo.getGoogleUser());
    }

    public ResultDTO registerUserLogic(SecondInformationDTO secondInformation) {
        Claims user = jwtService.extractAllClaims(secondInformation.gettempToken());
//                                                                        user.get returns an object so we use String.class as a type getter
        ResultDTO result = ResultDTO.googleUserSuccess(new GoogleUserDTO(user.get("googleSub", String.class), user.get("name", String.class), user.get("email", String.class), user.get("profilePicture", String.class), secondInformation.getRole()));

        if(result.isGoogleUserSuccess() || result.getGoogleUser() == null) {
            if(Objects.equals(secondInformation.getRole(), "USER")) {
//                check user in database
                Optional<User> userGoogleSub = userService.getUserByGoogleSub(result.getGoogleUser().getGoogleSub());
                if(userGoogleSub.isPresent()) {
                    return ResultDTO.errorMessage("User already registered");
                }

                User newUser = new User(result.getGoogleUser().getGoogleSub(), result.getGoogleUser().getName(), result.getGoogleUser().getEmail(), result.getGoogleUser().getRole() , result.getGoogleUser().getProfilePicture(), secondInformation.getUsername(), secondInformation.getPhoneNumber());
                userService.createUser(newUser);
                return ResultDTO.userSuccess(newUser);
            }

            Optional<Driver> driverGoogleSub = driverService.getDriverByGoogleSub(result.getGoogleUser().getGoogleSub());
            if(driverGoogleSub.isPresent()) {
                return ResultDTO.errorMessage("Driver is already registered");
            }
            Driver newDriver = new Driver(result.getGoogleUser().getGoogleSub(), result.getGoogleUser().getName(), result.getGoogleUser().getEmail(), result.getGoogleUser().getRole(), result.getGoogleUser().getProfilePicture(), secondInformation.getUsername(), secondInformation.getPhoneNumber(), secondInformation.getVehicleNumber(), secondInformation.getLicensePlate(), secondInformation.getDriversLicense());
            driverService.createDriver(newDriver);
            return ResultDTO.driverUserSuccess(newDriver);
        }

        return ResultDTO.errorMessage("Error: Invalid tempToken");
    }



    public ResultDTO loginUserLogic(String token) {
        ResultDTO user = verifier.verifyGoogleToken(token);

        if(user.isGoogleUserSuccess() || user.getGoogleUser() == null) {
            if(Objects.equals(user.getUser().getRole(), "USER")) {
                Optional<User> userGoogleSub = userService.getUserByGoogleSub(user.getGoogleUser().getGoogleSub());
                if(userGoogleSub.isPresent()) {
                    User userData = userGoogleSub.get();
                    return ResultDTO.userSuccess(userData);
                }
            }

            Optional<Driver> userDriver = driverService.getDriverByGoogleSub(user.getGoogleUser().getGoogleSub());
            if(userDriver.isPresent()) {
                Driver driverData = userDriver.get();
                return ResultDTO.driverUserSuccess(driverData);
            }
        }

        return ResultDTO.errorMessage("User is not found!");
    }

}
